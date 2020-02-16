import * as exec from '@actions/exec';
import * as core from '@actions/core';
import { readFileSync } from 'fs';
import { runAction, setInputs } from '../action';

const mainLocation = `test-main/index.js`;

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('rimraf');
jest.mock('fs');
jest.mock('yaml', () => ({
  parse: () => {
    return {
      name: 'test-action',
      runs: {
        main: mainLocation,
      },
    };
  },
}));

const token = 'test-token';
const repoName = 'test/repoName';
const actionDirectory = 'test-actionDirectory';
const workDirectory = 'test-workDirectory';

const testSha = 'cm0a40943mc903mac0349cmj3094m';

const testCwd = {
  cwd: workDirectory,
};

describe('runAction', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });
  afterEach(async () => {
    jest.resetModules();
  });

  test('masks token', async () => {
    await runAction({
      token,
      repoName,
      actionDirectory,
      workDirectory,
    });

    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setSecret).toHaveBeenCalledWith(token);
  });

  test('runs expected clone command', async () => {
    const expectedCmd = `git clone https://${token}@github.com/${repoName}.git ${workDirectory}`;
    await runAction({
      token,
      repoName,
      actionDirectory,
      workDirectory,
    });

    expect(exec.exec).toHaveBeenNthCalledWith(1, expectedCmd);
  });

  test('scrubs token from .git config', async () => {
    const expectedCmd = `git remote set-url origin https://github.com/${repoName}.git`;
    await runAction({
      token,
      repoName,
      actionDirectory,
      workDirectory,
    });

    expect(exec.exec).toHaveBeenNthCalledWith(2, expectedCmd, undefined, testCwd);
  });

  test('additional checkout performed if sha specified', async () => {
    const testRepoName = `${repoName}@${testSha}`;
    const expectedCmd = `git checkout ${testSha}`;
    await runAction({
      token,
      repoName: testRepoName,
      actionDirectory,
      workDirectory,
    });

    const checkingOutInfoCalled = (core.info as jest.Mock).mock.calls.some(c =>
      c.includes(`Checking out ${testSha}`)
    );
    expect(checkingOutInfoCalled).toBe(true);
    expect(exec.exec).toHaveBeenNthCalledWith(3, expectedCmd, undefined, testCwd);
  });

  test('no additional checkout performed if sha omitted', async () => {
    await runAction({
      token,
      repoName,
      actionDirectory,
      workDirectory,
    });

    const checkingOutInfoCalled = (core.info as jest.Mock).mock.calls.some(c =>
      c.includes(`Checking out ${testSha}`)
    );
    expect(checkingOutInfoCalled).toBe(false);
  });

  test('action loaded and executed from expected location when pal-action-directory not specified', async () => {
    const expectedPath = `${workDirectory}/action.yml`;
    await runAction({
      token,
      repoName,
      workDirectory,
    });

    expect(readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
    expect(exec.exec).toHaveBeenLastCalledWith(`node ${workDirectory}/${mainLocation}`);
  });

  test('action loaded from expected location when pal-action-directory specified', async () => {
    const expectedPath = `${workDirectory}/${actionDirectory}/action.yml`;
    await runAction({
      token,
      repoName,
      actionDirectory,
      workDirectory,
    });

    expect(readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
    expect(exec.exec).toHaveBeenLastCalledWith(
      `node ${workDirectory}/${actionDirectory}/${mainLocation}`
    );
  });
});
describe('setInputs', () => {
  test('function exits when no inputs exist', async () => {
    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
    });

    expect(core.info).toHaveBeenLastCalledWith('No inputs defined in action.');
    expect(
      (core.info as jest.Mock).mock.calls.some(c => c.includes('The configured inputs are'))
    ).toBe(false);
  });

  test('input passed via action handled properly', async () => {
    const name = 'test_input';
    const input = 'INPUT_TEST_INPUT';
    process.env[input] = '123';

    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
      inputs: {
        test_input: {
          value: '123',
        },
      },
    });

    expect(core.info).toHaveBeenLastCalledWith(`Input ${name} already set`);
  });

  test('omitted input that is not required and has no default is handled properly', async () => {
    const name = 'test_input';
    const input = 'INPUT_TEST_INPUT';
    delete process.env[input];

    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
      inputs: {
        test_input: {
          value: '123',
        },
      },
    });

    expect(core.info).toHaveBeenLastCalledWith(`Input ${name} not required and has no default`);
  });

  test('omitted input that is required without a default is handled properly', async () => {
    const name = 'test_input';
    const input = 'INPUT_TEST_INPUT';
    delete process.env[input];

    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
      inputs: {
        test_input: {
          value: 123,
          required: true,
        },
      },
    });

    expect(core.error).toHaveBeenLastCalledWith(
      `Input ${name} required but not provided and no default is set`
    );
  });

  test('omitted input that is optional with a default is handled properly', async () => {
    const input = 'INPUT_TEST_INPUT';
    delete process.env[input];

    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
      inputs: {
        test_input: {
          value: 123,
          default: 'default-value',
          required: false,
        },
      },
    });

    expect(process.env[input]).toBe('default-value');
  });

  test('omitted input that is required with a default is handled properly', async () => {
    const input = 'INPUT_TEST_INPUT';
    delete process.env[input];

    setInputs({
      name: 'test',
      runs: {
        main: 'main',
      },
      inputs: {
        test_input: {
          value: 123,
          default: 'default-value',
          required: true,
        },
      },
    });

    expect(process.env[input]).toBe('default-value');
  });
});
