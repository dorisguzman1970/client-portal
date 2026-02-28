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

async function getNextUserId(container) {
  const { resources } = await container.items.query('SELECT VALUE MAX(c.userId) FROM c').fetchAll();
  return (resources[0] || 0) + 1;
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();

  // GET – list users (admin only)
  if (method === 'GET') {
    const caller = await getCallerUser(req);
    if (!caller || !caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    try {
      const container = await getContainer('Users');
      const { resources } = await container.items.query('SELECT c.id, c.userId, c.userName, c.userEmail, c.userAdmin FROM c').fetchAll();
      context.res = { status: 200, body: resources };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // POST – create user (admin only)
  if (method === 'POST') {
    const caller = await getCallerUser(req);
    if (!caller || !caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { userName, userEmail, userAdmin } = req.body || {};
    if (!userName || !userEmail) {
      context.res = { status: 400, body: { message: 'userName and userEmail are required.' } };
      return;
    }
    try {
      const container = await getContainer('Users');
      // Check duplicate email
      const { resources: existing } = await container.items
        .query({ query: 'SELECT * FROM c WHERE c.userEmail = @email', parameters: [{ name: '@email', value: userEmail.toLowerCase() }] })
        .fetchAll();
      if (existing.length > 0) {
        context.res = { status: 409, body: { message: 'A user with this email already exists.' } };
        return;
      }
      const nextId = await getNextUserId(container);
      const newUser = { id: uuidv4(), userId: nextId, userName, userEmail: userEmail.toLowerCase(), userAdmin: userAdmin === true };
      await container.items.create(newUser);
      context.res = { status: 201, body: newUser };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // PUT – update user (admin only)
  if (method === 'PUT') {
    const caller = await getCallerUser(req);
    if (!caller || !caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { id, userName, userEmail, userAdmin } = req.body || {};
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Users');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'User not found.' } };
        return;
      }
      const updated = { ...resources[0], userName: userName ?? resources[0].userName, userEmail: (userEmail || resources[0].userEmail).toLowerCase(), userAdmin: userAdmin !== undefined ? userAdmin === true : resources[0].userAdmin };
      await container.items.upsert(updated);
      context.res = { status: 200, body: updated };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // DELETE – delete user (admin only)
  if (method === 'DELETE') {
    const caller = await getCallerUser(req);
    if (!caller || !caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const id = req.query.id || (req.body && req.body.id);
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Users');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'User not found.' } };
        return;
      }
      await container.item(id, resources[0].userEmail).delete();
      context.res = { status: 200, body: { message: 'User deleted.' } };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  context.res = { status: 405, body: { message: 'Method not allowed.' } };
};
