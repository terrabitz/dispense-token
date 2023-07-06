const core = require('@actions/core');
const httpClient = require("@actions/http-client")


// most @actions toolkit packages have async methods
async function run() {
  try {
    const hostname = core.getInput('hostname');
    const repo = core.getInput('repo');
    const permissions = core.getInput('permissions');

    let oidcToken
    try {
      oidcToken = await core.getIDToken();
    } catch (e) {
      throw new Error("unable to get OIDC token; make sure you have 'id-token: write' permissions enabled on your workflow")
    }

    const permsMap = {};
    permissions.split("\n").forEach(perm => {
      const trimmed = perm.trim()
      if (trimmed === ""){
        return
      }

      const split = perm.split(": ", 2)
      const resource = split[0]
      const accessLevel = split[1]
      permsMap[resource] = accessLevel
    });

    const payload = {
      repo,
      token: oidcToken,
      permissions: permsMap,
    };

    const client = new httpClient.HttpClient();
    const res = await client.post(`https://${hostname}/token`, payload);
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
