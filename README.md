# Private Action Loader

This action loads and executes a private Action.  This allows private actions to be reused in other private repositories.  All inputs are passed down into the private action.

## Inputs

### `repo-token`

**Required** An access token with the `repo` scope to the repository containing the action.  This should be stored as a [repo secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets).

### `repo-name`

**Required** The name of the repository containing the action. Must be in the format of `{owner}/{repo}`.  E.g., `invisionapp/private-action-loader`

### `repo-branch`

**Optional** The branch of the repository to pull down. Defaults to `master`

## Example usage w/ additional parameters
``` yaml
    - uses: invisionapp/private-action-loader@v1
      with:
        repo-token: ${{ secrets.REPO_TOKEN }}
        repo-name: some-org/super-secret-action
        # the following input gets passed to the private action
        input-used-by-other-action: this is used by super-secret-action
```

## Example usage w/o additional parameters
``` yaml
    - uses: invisionapp/private-action-loader@v1
      with:
        repo-token: ${{ secrets.REPO_TOKEN }}
        repo-name: some-org/super-secret-action
```