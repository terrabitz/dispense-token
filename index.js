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
    core.debug(`requesting token; url=${url} repo=${repo} permissions=${JSON.stringify(permsMap)}`)

    const client = new HttpClient('terrabitz-dispense-token');
    const res = await client.postJson(url, payload);
    const body = await res.readBody();
    if (res.message.statusCode != 200) {
      const errMessage = JSON.parse(body)
      throw new Error(errMessage.error)
    }

    core.setSecret(body)
    core.setOutput("token", body)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
