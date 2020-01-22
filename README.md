# Private Action Loader

[![Actions Status](https://github.com/invisionapp/private-action-loader/workflows/ci/badge.svg?branch=develop)](https://github.com/invisionapp/private-action-loader/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Dependency Status](https://david-dm.org/InVisionApp/private-action-loader.svg)](https://david-dm.org/InVisionApp/private-action-loader)
[![devDependency Status](https://david-dm.org/InVisionApp/private-action-loader/dev-status.svg)](https://david-dm.org/InVisionApp/private-action-loader#info=devDependencies)
[![Maintainability](https://api.codeclimate.com/v1/badges/42214051e003ca757d60/maintainability)](https://codeclimate.com/github/InVisionApp/private-action-loader/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/42214051e003ca757d60/test_coverage)](https://codeclimate.com/github/InVisionApp/private-action-loader/test_coverage)

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
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
    pal-action-directory: src/super-secret-nested-action
```

## Example usage w/ additional parameters

```yaml
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
    # the following input gets passed to the private action
    input-used-by-other-action: this will be passed to super-secret-action
```

## Example usage w/o additional parameters

```yaml
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action
```

## Example usage w/ SHA

```yaml
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@b8a83a0
```

## Example usage w/ Branch

```yaml
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@master
```

## Example usage w/ Tag

```yaml
- uses: invisionapp/private-action-loader@v3
  with:
    pal-repo-token: ${{ secrets.REPO_TOKEN }}
    pal-repo-name: some-org/super-secret-action@v1
```

## Example usage w/ Output

```yaml
- uses: invisionapp/private-action-loader@v3
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
- There is very little error handling so far
