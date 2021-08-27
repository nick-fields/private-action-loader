import * as Exec from '@actions/exec';

export async function findNode(exec: typeof Exec): Promise<string> {
  const { stdout } = await exec.getExecOutput('systemctl', ['cat', 'actions.runner*']);

  const workingDirectory = stdout.match(/WorkingDirectory=(.+)/);

  if (!workingDirectory) throw new Error(`Not found :(`);
  const runnerRoot = workingDirectory[1];

  return `${runnerRoot}/externals/node12`;
}
