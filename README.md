# Private Action Loader

[![Actions Status](https://github.com/nick-invision/private-action-loader/workflows/ci/badge.svg?branch=develop)](https://github.com/nick-invision/private-action-loader/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Dependency Status](https://david-dm.org/nick-invision/private-action-loader.svg)](https://david-dm.org/nick-invision/private-action-loader)
[![devDependency Status](https://david-dm.org/nick-invision/private-action-loader/dev-status.svg)](https://david-dm.org/nick-invision/private-action-loader#info=devDependencies)
[![Code Coverage](https://codecov.io/gh/nick-invision/private-action-loader/branch/master/graph/badge.svg?token=ouop84H9gO)](https://codecov.io/gh/nick-invision/private-action-loader)

This action loads and executes a private Action. This allows private actions to be reused in other private repositories. All inputs are passed down into the private action. All outputs of the private actions are passed back to the loader action.

---

## **Inputs**

### **`pal-repo-token`**

**Required** An access token with the [repo](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) scope to the repository containing the action. **This should be stored as a [repo secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)**.

### **`pal-repo-name`**

**Required** The repository containing the action. A ref can also be appended to specify an exact commit of the action (SHA, tag, or branch). Must be in the format of `{owner}/{repo}` or `{owner}/{repo}@{sha}`.

### **`pal-action-directory`**

**Optional** Directory containing the `action.yml` that you would like to execute in repo. If omitted, the root directory is assumed to be the location of `action.yml`.

---

## **Examples**

## Example usage w/ pal-action-directory

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
    pal-action-directory: src/super-secret-nested-action
```

## Example usage w/ additional parameters

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
    # the following input gets passed to the private action
    input-used-by-other-action: this will be passed to super-secret-action
```

## Example usage w/o additional parameters

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
```

## Example usage w/ SHA

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@b8a83a0
```

## Example usage w/ Branch

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@master
```

## Example usage w/ Tag

```yaml
- uses: nick-invision/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@v1
```

## Example usage w/ Output

```yaml
- uses: nick-invision/private-action-loader@v3
  id: output_example
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@v1
- name: Get the previous output
  run: echo "The previous output was ${{ steps.output_example.outputs.<name of output> }}"
```

---

## **Limitations**

- Only supports javascript actions

## **Ownership**

As of 2021/04/28 ownership of this project has been transferred from the InVisionApp organization to my personal nick-invision account due to changes to our organization level security settings that conflicts with public GitHub Actions.  I am the author and have been the primary maintainer since day one and will continue to maintain this as needed.  

No immediate action is required if you rely on this as GitHub handles ownership transfers pretty well. Any current workflow reference to `invisionapp/private-action-loader@<whatever>` will still work, but will just pull from `nick-invision/private-action-loader@<whatever>` instead.  Who knows how long that will work, so at some point it would be beneficial to update your workflows to reflect the new owner accordingly.
