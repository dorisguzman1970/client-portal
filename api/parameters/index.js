const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

const PARAM_ID = 'parameters';
const PARTITION_KEY = 'parameters';

async function getCallerUser(req) {
  const principal = getPrincipal(req);
  if (!principal) return null;
  const container = await getContainer('Users');
  const { resources } = await container.items
    .query({ query: 'SELECT * FROM c WHERE c.userEmail = @email', parameters: [{ name: '@email', value: principal.userEmail }] })
    .fetchAll();
  return resources[0] || null;
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();

  // GET – anyone can read parameters (used on welcome screen)
  if (method === 'GET') {
    try {
      const container = await getContainer('Parameters');
      const { resources } = await container.items.query('SELECT * FROM c WHERE c.id = "parameters"').fetchAll();
      if (resources.length === 0) {
        context.res = { status: 200, body: null };
      } else {
        const { empLogo: _l, ...meta } = resources[0];
        context.res = { status: 200, body: { ...resources[0] } };
      }
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // All write operations require admin
  const caller = await getCallerUser(req);
  if (!caller || !caller.userAdmin) {
    context.res = { status: 403, body: { message: 'Access denied.' } };
    return;
  }

  // POST – create (only if no record exists)
  if (method === 'POST') {
    const { empName, empLogo, empLogoName } = req.body || {};
    if (!empName) {
      context.res = { status: 400, body: { message: 'empName is required.' } };
      return;
    }
    try {
      const container = await getContainer('Parameters');
      const { resources } = await container.items.query('SELECT * FROM c WHERE c.id = "parameters"').fetchAll();
      if (resources.length > 0) {
        context.res = { status: 409, body: { message: 'Parameters already exist. Use PUT to update.' } };
        return;
      }
      const params = { id: PARAM_ID, empName, empLogo: empLogo || '', empLogoName: empLogoName || '' };
      await container.items.create(params);
      context.res = { status: 201, body: params };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // PUT – update existing record
  if (method === 'PUT') {
    const { empName, empLogo, empLogoName } = req.body || {};
    try {
      const container = await getContainer('Parameters');
      const { resources } = await container.items.query('SELECT * FROM c WHERE c.id = "parameters"').fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Parameters not found. Use POST to create.' } };
        return;
      }
      const existing = resources[0];
      const updated = {
        ...existing,
        empName: empName ?? existing.empName,
        empLogo: empLogo !== undefined ? empLogo : existing.empLogo,
        empLogoName: empLogoName ?? existing.empLogoName,
      };
      await container.items.upsert(updated);
      context.res = { status: 200, body: updated };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // DELETE
  if (method === 'DELETE') {
    try {
      const container = await getContainer('Parameters');
      const { resources } = await container.items.query('SELECT * FROM c WHERE c.id = "parameters"').fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Parameters not found.' } };
        return;
      }
      await container.item(PARAM_ID, PARTITION_KEY).delete();
      context.res = { status: 200, body: { message: 'Parameters deleted.' } };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  context.res = { status: 405, body: { message: 'Method not allowed.' } };
};
