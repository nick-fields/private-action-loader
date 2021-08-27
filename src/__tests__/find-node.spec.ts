import { findNode } from '../find-node';
import * as Exec from '@actions/exec';

describe('find node', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });
  afterEach(async () => {
    jest.resetModules();
  });

  const getExecOutput = jest.fn();
  const exec = { getExecOutput } as unknown as typeof Exec;

  it('should find node executable on ubuntu', async () => {
    const systemctlOutput = `# /etc/systemd/system/actions.runner.actions-test-repo.hostname.service
[Unit]
Description=GitHub Actions Runner (mytest-thing-thingy.hostname)
After=network.target

[Service]
ExecStart=/tmp/actions-runner/runsvc.sh
User=rethab
WorkingDirectory=/tmp/actions-runner
KillMode=process
KillSignal=SIGTERM
TimeoutStopSec=5min

[Install]
WantedBy=multi-user.target `;

    getExecOutput.mockResolvedValueOnce({
      stdout: systemctlOutput,
      exitCode: 0,
      stderr: '',
    });
    const executable = await findNode(exec);
    expect(executable).toStrictEqual('/tmp/actions-runner/externals/node12');
  });
});
