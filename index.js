const exec = require('@actions/exec');
const core = require('@actions/core');
const {parse} = require('yaml');
const {readFileSync} = require('fs');
const {join} = require('path');

const GITHUB_TOKEN = core.getInput('repo-token', {required: true});
const GITHUB_REPO = core.getInput('repo-name', {required: true});
const GITHUB_BRANCH = core.getInput('repo-branch', {required: false});
const GITHUB_SHA = core.getInput('repo-sha', {required: false});

const DEFAULT_BRANCH = 'master'
const WORKING_DIR = './.private-action'

async function run() {
  const repo = `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`
  const cmd = [
    'git clone', 
    '--single-branch', 
    '--no-tags', 
    '--depth 1', 
    `-b ${GITHUB_BRANCH || DEFAULT_BRANCH}`, 
    repo,  
    WORKING_DIR
  ].join(' ')

  core.startGroup(`Cloning private action`)
  core.info(`Cloning action from https://***TOKEN***@github.com/${GITHUB_REPO}.git`);
  await exec.exec(cmd);

  if (GITHUB_SHA) {
    core.info(`Checking out SHA ${GITHUB_SHA}`)
    await exec.exec(`git checkout ${GITHUB_SHA}`);
  }

  core.info('Reading action.yml');
  const actionFile = readFileSync(`${WORKING_DIR}/action.yml`, 'utf8');
  const action = parse(actionFile);

  if (!(action && action.name && action.runs && action.runs.main)) {
    throw `Malformed action.yml found`
  }
  core.endGroup(`Cloning private action`)

  core.info(`Starting private action ${action.name}`)
  core.startGroup(`${action.name}`)
  await exec.exec(`node ${join(WORKING_DIR, action.runs.main)}`)
  core.endGroup(`${action.name}`)
}

run().then(() => {
  console.log('Action was successful');
}).catch((e) => {
  core.setFailed(e.toString());
});
