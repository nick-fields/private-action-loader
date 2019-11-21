# Private Action Loader

[![Actions Status](https://github.com/invisionapp/private-action-loader/workflows/ci/badge.svg?branch=develop)](https://github.com/invisionapp/private-action-loader/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Dependency Status](https://david-dm.org/InVisionApp/private-action-loader.svg)](https://david-dm.org/InVisionApp/private-action-loader)
[![devDependency Status](https://david-dm.org/InVisionApp/private-action-loader/dev-status.svg)](https://david-dm.org/InVisionApp/private-action-loader#info=devDependencies)
[![badge](https://img.shields.io/badge/status-awesome-brightgreen.svg)](https://shields.io/)

This action loads and executes a private Action.  This allows private actions to be reused in other private repositories.  All inputs are passed down into the private action.

## *Inputs*

### **`repo-token`**

**Required** An access token with the `repo` scope to the repository containing the action.  **This should be stored as a [repo secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)**.

### **`repo-name`**

**Required** The name of the repository containing the action.  A SHA (short or long) can also be appended to specify an exact commit of the action. Must be in the format of `{owner}/{repo}` or `{owner}/{repo}@{sha}`.  E.g., `invisionapp/private-action-loader@505bd59`

### **`repo-branch`**

**Optional** The branch of the repository to pull down. Defaults to `master`

## Example usage w/ additional parameters
``` yaml
    - uses: invisionapp/private-action-loader@v1
      with:
        repo-token: ${{ secrets.REPO_TOKEN }}
        repo-name: some-org/super-secret-action
        # the following input gets passed to the private action
        input-used-by-other-action: this will be passed to super-secret-action
```

## Example usage w/o additional parameters
``` yaml
    - uses: invisionapp/private-action-loader@v1
      with:
        repo-token: ${{ secrets.REPO_TOKEN }}
        repo-name: some-org/super-secret-action
```

## Example usage w/ SHA
``` yaml
    - uses: invisionapp/private-action-loader@v1
      with:
        repo-token: ${{ secrets.REPO_TOKEN }}
        repo-name: some-org/super-secret-action@b8a83a0
```

## Limitations
* Only supports javascript actions
* There are no tests yet
* There is very little error handling so far