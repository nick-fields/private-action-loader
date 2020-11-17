import * as exec from '@actions/exec';
import * as core from '@actions/core';
import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sync } from 'rimraf';

export function setInputs(action: any): void {
  if (!action.inputs) {
    core.info('No inputs defined in action.');
    return;
  }

  core.info(`The configured inputs are ${Object.keys(action.inputs)}`);

  for (const i of Object.keys(action.inputs)) {
    const formattedInputName = `INPUT_${i.toUpperCase()}`;

    if (process.env[formattedInputName]) {
      core.info(`Input ${i} already set`);
      continue;
    } else if (!action.inputs[i].required && !action.inputs[i].default) {
      core.info(`Input ${i} not required and has no default`);
      continue;
    } else if (action.inputs[i].required && !action.inputs[i].default) {
      core.error(`Input ${i} required but not provided and no default is set`);
    }

    core.info(`Input ${i} not set.  Using default '${action.inputs[i].default}'`);
    process.env[formattedInputName] = action.inputs[i].default;
  }
}

export async function runAction(opts: {
  token: string;
  repoName: string;
  workDirectory: string;
  actionDirectory?: string;
  partialCheckout?: string;
}): Promise<void> {
  const [repo, sha] = opts.repoName.split('@');

  core.info('Masking token just in case');
  core.setSecret(opts.token);

  core.startGroup('Cloning private action');
  const repoUrl = `https://${opts.token}@github.com/${repo}.git`;

  if (['true', 'TRUE', 1].includes(opts.partialCheckout!)) {
    if (!opts.actionDirectory) {
      throw new Error('Experimental partial-checkout feature requires action-directory.');
    }
    await partialCheckout({
      repoUrl,
      sha,
      workDirectory: opts.workDirectory,
      actionDirectory: opts.actionDirectory!,
    });
  } else {
    const cmd = ['git clone', repoUrl, opts.workDirectory].join(' ');

    core.info(`Cleaning workDirectory`);
    sync(opts.workDirectory);

    core.info(
      `Cloning action from https://***TOKEN***@github.com/${repo}.git${sha ? ` (SHA: ${sha})` : ''}`
    );
    await exec.exec(cmd);

    if (sha) {
      core.info(`Checking out ${sha}`);
      await exec.exec(`git checkout ${sha}`, undefined, { cwd: opts.workDirectory });
    }
  }

  core.info('Remove github token from config');
  await exec.exec(`git remote set-url origin https://github.com/${repo}.git`, undefined, {
    cwd: opts.workDirectory,
  });

  // if actionDirectory specified, join with workDirectory (for use when multiple actions exist in same repo)
  // if actionDirectory not specified, use workDirectory (for repo with a single action at root)
  const actionPath = opts.actionDirectory
    ? join(opts.workDirectory, opts.actionDirectory)
    : opts.workDirectory;

  core.info(`Reading ${actionPath}`);
  const actionFile = readFileSync(`${actionPath}/action.yml`, 'utf8');
  const action = parse(actionFile);

  if (!(action && action.name && action.runs && action.runs.main)) {
    throw new Error('Malformed action.yml found');
  }

  core.endGroup();

  core.startGroup('Input Validation');
  setInputs(action);
  core.endGroup();

  core.info(`Starting private action ${action.name}`);
  await exec.exec(`node ${join(actionPath, action.runs.main)}`);

  core.info(`Cleaning up action`);
  sync(opts.workDirectory);
}

/**
 * Experimental feature to reduce network waste and
 * time-to-action. Makes use of `git sparse-checkout`
 * to _partially_ clone the repository, specifically,
 * it only pulls the root, and actionDirectory files.
 */
async function partialCheckout({
  repoUrl,
  sha,
  workDirectory,
  actionDirectory,
}: {
  repoUrl: string;
  sha: string;
  workDirectory: string;
  actionDirectory: string;
}) {
  core.info('Use experimental sparse-checkout feature');

  // only clone the `.git` folder
  const cmd = ['git clone', '--filter=blob:none', '--no-checkout', repoUrl, workDirectory].join(
    ' '
  );

  core.info(`Cleaning workDirectory`);
  sync(workDirectory);

  core.info(`Partial cloning repository...`);
  await exec.exec(cmd);

  // this command will run `config core.sparsecheckout true` under the bonnet
  // ensuring the root files will be pull later (--cone)
  core.info(`Enabling sparse-checkout`);
  await exec.exec(`git sparse-checkout init --cone`, undefined, { cwd: workDirectory });

  if (sha) {
    core.info(`Checking out ${sha}`);
    await exec.exec(`git checkout ${sha}`, undefined, { cwd: workDirectory });
  } else {
    // force git to re-evaluate tree after sparse-checkout init
    await exec.exec(`git read-tree -mu HEAD`, undefined, { cwd: workDirectory });
  }

  core.info(`Pulling actionDirectory ${actionDirectory}`);
  await exec.exec(`git sparse-checkout set ${actionDirectory}`, undefined, { cwd: workDirectory });
}
