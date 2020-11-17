import * as core from '@actions/core';
import { runAction } from './action';

const token = core.getInput('pal-repo-token', { required: true });
const repoName = core.getInput('pal-repo-name', { required: true });
const actionDirectory = core.getInput('pal-action-directory', { required: false });
const partialCheckout = core.getInput('pal-partial-checkout', { required: false });
const workDirectory = './.private-action';

runAction({
  token,
  repoName,
  actionDirectory,
  workDirectory,
  partialCheckout
})
  .then(() => {
    core.info('Action completed successfully');
  })
  .catch(e => {
    core.setFailed(e.toString());
  });
