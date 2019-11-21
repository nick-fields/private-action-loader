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

  core.info('Remove github token from config')
  await exec.exec(`git remote set-url origin https://github.com/${repo}.git`, null, { cwd: WORKING_DIR })
  core.endGroup('Cloning private action')

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

run().then(() => {
  core.info('Action completed successfully')
}).catch((e) => {
  core.setFailed(e.toString())
})
