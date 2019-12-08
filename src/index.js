const exec = require('@actions/exec')
const core = require('@actions/core')
const { parse } = require('yaml')
const { readFileSync } = require('fs')
const { join } = require('path')

const GITHUB_TOKEN = core.getInput('repo-token', { required: true })
const GITHUB_REPO = core.getInput('repo-name', { required: true })
const WORKING_DIR = './.private-action'

async function run () {
  const { repo, sha } = parseRepo()

  core.info('Masking token just in case')
  core.setSecret(GITHUB_TOKEN)

  core.startGroup('Cloning private action')
  const repoUrl = `https://${GITHUB_TOKEN}@github.com/${repo}.git`
  const cmd = [
    'git clone',
    repoUrl,
    WORKING_DIR
  ].join(' ')

  core.info(`Cloning action from https://***TOKEN***@github.com/${repo}.git${sha ? ` (SHA: ${sha})` : ''}`)
  await exec.exec(cmd)

  core.info('Remove github token from config')
  await exec.exec(`git remote set-url origin https://github.com/${repo}.git`, null, { cwd: WORKING_DIR })

  if (sha) {
    core.info(`Checking out ${sha}`)
    await exec.exec(`git checkout ${sha}`, null, { cwd: WORKING_DIR })
  }

  core.info('Reading action.yml')
  const actionFile = readFileSync(`${WORKING_DIR}/action.yml`, 'utf8')
  const action = parse(actionFile)
  
  if (!(action && action.name && action.runs && action.runs.main)) {
    throw new Error('Malformed action.yml found')
  }

  core.endGroup('Cloning private action')
  
  core.startGroup('Input Setting')
  function getVals(label){
    const keys = Object.keys(process.env)
    .filter(key => key.startsWith('INPUT_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});

    console.log(label, JSON.stringify(keys, null, 2))
  }
  getVals('***BEFORE***')
  setInputs(action)
  getVals('***AFTER***')
  core.endGroup('Input Setting')

  core.info(`Starting private action ${action.name}`)
  core.startGroup(`${action.name}`)
  await exec.exec(`node ${join(WORKING_DIR, action.runs.main)}`)
  core.endGroup(`${action.name}`)
}

function parseRepo () {
  const repoArr = GITHUB_REPO.split('@')
  return {
    repo: repoArr[0],
    sha: repoArr[1]
  }
}

function setInputs(action){
  if (!action.inputs) {
    core.info('No inputs defined in action.');
    return;
  }

  for (const i of Object.keys(action.inputs)) {
    const formattedInputName = `INPUT_${i.toUpperCase()}`;

    if ((process.env[formattedInputName])) {
      core.info(`Input ${action.input[i]} already set`)
      // the input was provided, or not provided but not required or w/ default
      return;
    } else if (!action.inputs[i].required && !action.inputs[i].default) {
      core.info(`Input ${action.inputs[i]} not required and has no default`)
      return;
    } else if (action.inputs[i].required && !action.inputs[i].default) {
      // input not provided, is required, and no default set
      core.error(`Input ${i} required but not provided and no default is set`);
    }

    // input not provided so use the default
    core.info(`Input ${action.inputs[i]} not set.  Using default ${action.inputs[i].default}`)
    process.env[formattedInputName] = action.inputs[i].default
  }

}

run().then(() => {
  core.info('Action completed successfully')
}).catch((e) => {
  core.setFailed(e.toString())
})
