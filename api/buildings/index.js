const { v4: uuidv4 } = require('uuid');
const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

async function getCallerUser(req) {
  const principal = getPrincipal(req);
  if (!principal) return null;
  const container = await getContainer('Users');
  const { resources } = await container.items
    .query({ query: 'SELECT * FROM c WHERE c.userEmail = @email', parameters: [{ name: '@email', value: principal.userEmail }] })
    .fetchAll();
  return resources[0] || null;
}

async function getNextBuildingId(container) {
  const { resources } = await container.items.query('SELECT VALUE MAX(c.buildingId) FROM c').fetchAll();
  return (resources[0] || 0) + 1;
}

// Get clientIds that belong to a given userId (for non-admin filtering)
async function getClientIdsForUser(userId) {
  const container = await getContainer('Clients');
  const { resources } = await container.items
    .query({ query: 'SELECT c.clientId FROM c WHERE c.userId = @uid', parameters: [{ name: '@uid', value: userId }] })
    .fetchAll();
  return resources.map(r => r.clientId);
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();
  const caller = await getCallerUser(req);

  if (!caller) {
    context.res = { status: 401, body: { message: 'Not authenticated.' } };
    return;
  }

  // GET – list buildings
  if (method === 'GET') {
    try {
      const container = await getContainer('Buildings');
      let resources;
      if (caller.userAdmin) {
        ({ resources } = await container.items.query('SELECT * FROM c ORDER BY c.buildingId').fetchAll());
      } else {
        const clientIds = await getClientIdsForUser(caller.userId);
        if (clientIds.length === 0) {
          context.res = { status: 200, body: [] };
          return;
        }
        const idList = clientIds.map((_, i) => `@cid${i}`).join(', ');
        const parameters = clientIds.map((id, i) => ({ name: `@cid${i}`, value: id }));
        ({ resources } = await container.items
          .query({ query: `SELECT * FROM c WHERE c.clientId IN (${idList}) ORDER BY c.buildingId`, parameters })
          .fetchAll());
      }
      context.res = { status: 200, body: resources };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // POST – create building (admin only)
  if (method === 'POST') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { buildingName, clientId, buildingAddress } = req.body || {};
    if (!buildingName || !clientId) {
      context.res = { status: 400, body: { message: 'buildingName and clientId are required.' } };
      return;
    }
    try {
      const container = await getContainer('Buildings');
      const nextId = await getNextBuildingId(container);
      const newBuilding = { id: uuidv4(), buildingId: nextId, buildingName, clientId: Number(clientId), buildingAddress: buildingAddress || '' };
      await container.items.create(newBuilding);
      context.res = { status: 201, body: newBuilding };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // PUT – update building (admin only)
  if (method === 'PUT') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { id, buildingName, clientId, buildingAddress } = req.body || {};
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Buildings');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Building not found.' } };
        return;
      }
      const existing = resources[0];
      const updated = {
        ...existing,
        buildingName: buildingName ?? existing.buildingName,
        clientId: clientId !== undefined ? Number(clientId) : existing.clientId,
        buildingAddress: buildingAddress ?? existing.buildingAddress,
      };
      await container.items.upsert(updated);
      context.res = { status: 200, body: updated };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // DELETE – delete building (admin only)
  if (method === 'DELETE') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const id = req.query.id || (req.body && req.body.id);
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Buildings');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Building not found.' } };
        return;
      }
      await container.item(id, resources[0].buildingId).delete();
      context.res = { status: 200, body: { message: 'Building deleted.' } };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  context.res = { status: 405, body: { message: 'Method not allowed.' } };
};
