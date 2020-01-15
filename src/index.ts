import * as core from '@actions/core';
import { runAction } from './action';

const token = core.getInput('repo-token', { required: true });
const repoName = core.getInput('repo-name', { required: true });
const actionDirectory = core.getInput('action-directory', { required: false });
const workDirectory = './.private-action';

runAction({
  token,
  repoName,
  actionDirectory,
  workDirectory,
})
  .then(() => {
    core.info('Action completed successfully');
  })
  .catch(e => {
    core.setFailed(e.toString());
  });
