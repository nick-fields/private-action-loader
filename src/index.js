const exec = require('@actions/exec')
const core = require('@actions/core')
const { parse } = require('yaml')
const { readFileSync } = require('fs')
const { join } = require('path')
const rimraf = require('rimraf')

const GITHUB_TOKEN = core.getInput('repo-token', { required: true })
const GITHUB_REPO = core.getInput('repo-name', { required: true })
const GITHUB_BRANCH = core.getInput('repo-branch', { required: false })

const DEFAULT_BRANCH = 'master'
const WORKING_DIR = './.private-action'

async function run () {
  const { repo, sha } = parseRepo()

  core.info('Masking secret, just in case')
  core.setSecret(GITHUB_TOKEN)

  core.startGroup('Cloning private action')
  const repoUrl = `https://${GITHUB_TOKEN}@github.com/${repo}.git`
  const cmd = [
    'git clone',
    '--single-branch',
    '--no-tags',
    sha ? '' : '--depth 1', // to checkout by sha, need full tree, otherwise this is much faster
    `--branch ${GITHUB_BRANCH || DEFAULT_BRANCH}`,
    repoUrl,
    WORKING_DIR
  ].join(' ')

  core.info(`Cloning action from https://***TOKEN***@github.com/${repo}.git${sha ? ` (SHA: ${sha})` : ''}`)
  await exec.exec(cmd)

  if (sha) {
    core.info(`Checking out SHA ${sha}`)
    await exec.exec(`git checkout ${sha}`, null, { cwd: WORKING_DIR })
  }

  core.info('Reading action.yml')
  const actionFile = readFileSync(`${WORKING_DIR}/action.yml`, 'utf8')
  const action = parse(actionFile)

  if (!(action && action.name && action.runs && action.runs.main)) {
    throw new Error('Malformed action.yml found')
  }
  core.endGroup('Cloning private action')

  core.info(`Starting private action ${action.name}`)
  core.startGroup(`${action.name}`)
  await exec.exec(`node ${join(WORKING_DIR, action.runs.main)}`)
  core.endGroup(`${action.name}`)

  core.startGroup('Cleaning up')
  core.info('Deleting cloned directory to prevent potential sensitive data persisting')
  rimraf.sync(WORKING_DIR)
  core.endGroup('Cleaning up')
}

function parseRepo () {
  const repoArr = GITHUB_REPO.split('@')
  return {
    repo: repoArr[0],
    sha: repoArr[1]
  }
}

run().then(() => {
  console.log('Action was successful')
}).catch((e) => {
  core.setFailed(e.toString())
})
