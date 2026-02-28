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

async function getNextClientId(container) {
  const { resources } = await container.items.query('SELECT VALUE MAX(c.clientId) FROM c').fetchAll();
  return (resources[0] || 0) + 1;
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();
  const caller = await getCallerUser(req);

  if (!caller) {
    context.res = { status: 401, body: { message: 'Not authenticated.' } };
    return;
  }

  // GET – list clients
  if (method === 'GET') {
    try {
      const container = await getContainer('Clients');
      let query;
      if (caller.userAdmin) {
        query = { query: 'SELECT * FROM c ORDER BY c.clientId' };
      } else {
        query = { query: 'SELECT * FROM c WHERE c.userId = @uid ORDER BY c.clientId', parameters: [{ name: '@uid', value: caller.userId }] };
      }
      const { resources } = await container.items.query(query).fetchAll();
      context.res = { status: 200, body: resources };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // POST – create client (admin only)
  if (method === 'POST') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { clientName, userId, clientPhone } = req.body || {};
    if (!clientName || !userId) {
      context.res = { status: 400, body: { message: 'clientName and userId are required.' } };
      return;
    }
    try {
      const container = await getContainer('Clients');
      const nextId = await getNextClientId(container);
      const newClient = { id: uuidv4(), clientId: nextId, clientName, userId: Number(userId), clientPhone: clientPhone || '' };
      await container.items.create(newClient);
      context.res = { status: 201, body: newClient };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // PUT – update client (admin only)
  if (method === 'PUT') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { id, clientName, userId, clientPhone } = req.body || {};
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Clients');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Client not found.' } };
        return;
      }
      const existing = resources[0];
      const updated = {
        ...existing,
        clientName: clientName ?? existing.clientName,
        userId: userId !== undefined ? Number(userId) : existing.userId,
        clientPhone: clientPhone ?? existing.clientPhone,
      };
      await container.items.upsert(updated);
      context.res = { status: 200, body: updated };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // DELETE – delete client (admin only)
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
      const container = await getContainer('Clients');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Client not found.' } };
        return;
      }
      await container.item(id, resources[0].clientId).delete();
      context.res = { status: 200, body: { message: 'Client deleted.' } };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  context.res = { status: 405, body: { message: 'Method not allowed.' } };
};
