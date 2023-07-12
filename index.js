const core = require('@actions/core');
const {HttpClient} = require("@actions/http-client")


// most @actions toolkit packages have async methods
async function run() {
  try {
    const hostname = core.getInput('hostname');
    const repo = core.getInput('repo');
    const permissions = core.getMultilineInput('permissions').reduce((result, scopePermission) => {
      const [scope, permission] = scopePermission.split(':').map(it => it.trim())
      result[scope] = permission
      return result
  }, {})

    let oidcToken
    try {
      oidcToken = await core.getIDToken();
    } catch (e) {
      throw new Error("unable to get OIDC token; make sure you have 'id-token: write' permissions enabled on your workflow")
    }


    const payload = {
      repo,
      token: oidcToken,
      permissions: permissions,
    };

    const url = `https://${hostname}/token`
    core.info(`requesting token; url=${url} repo=${repo} permissions=${JSON.stringify(permsMap)}`)

    const client = new HttpClient('terrabitz-dispense-token');
    const token = await client.postJson(url, payload).then(res => {
      if (res.statusCode >= 400) {
        core.error(res.result)
        throw new Error(`hostname: ${hostname} statusCode: ${res.statusCode} message:${res.result.json.error}`)
      }

      return res.result
    }).catch(err => {
        if (err instanceof HttpClientError && err.result?.error?.message) {
            throw new Error(err.result.error.message)
        }

        throw err
    })

    core.setSecret(token)
    core.setOutput("token", token)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
