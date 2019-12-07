import * as core from '@actions/core';
import { runAction } from './action';

<<<<<<< HEAD
const token = core.getInput('pal-repo-token', { required: true });
const repoName = core.getInput('pal-repo-name', { required: true });
const actionDirectory = core.getInput('pal-action-directory', { required: false });
=======
const token = core.getInput('repo-token', { required: true });
const repoName = core.getInput('repo-name', { required: true });
const actionDirectory = core.getInput('action-directory', { required: false });
>>>>>>> 873fcc0... Develop (#8)
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
