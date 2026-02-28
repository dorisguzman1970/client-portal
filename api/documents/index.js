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

async function getNextDocumentId(container) {
  const { resources } = await container.items.query('SELECT VALUE MAX(c.documentId) FROM c').fetchAll();
  return (resources[0] || 0) + 1;
}

// Get buildingIds accessible to a non-admin user (via their clients)
async function getBuildingIdsForUser(userId) {
  const clientsContainer = await getContainer('Clients');
  const { resources: clients } = await clientsContainer.items
    .query({ query: 'SELECT c.clientId FROM c WHERE c.userId = @uid', parameters: [{ name: '@uid', value: userId }] })
    .fetchAll();
  if (clients.length === 0) return [];
  const clientIds = clients.map(c => c.clientId);
  const buildingsContainer = await getContainer('Buildings');
  const idList = clientIds.map((_, i) => `@cid${i}`).join(', ');
  const parameters = clientIds.map((id, i) => ({ name: `@cid${i}`, value: id }));
  const { resources: buildings } = await buildingsContainer.items
    .query({ query: `SELECT c.buildingId FROM c WHERE c.clientId IN (${idList})`, parameters })
    .fetchAll();
  return buildings.map(b => b.buildingId);
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();
  const caller = await getCallerUser(req);

  if (!caller) {
    context.res = { status: 401, body: { message: 'Not authenticated.' } };
    return;
  }

  // GET – list documents (without file content to reduce payload)
  if (method === 'GET') {
    try {
      const container = await getContainer('Documents');
      let resources;
      if (caller.userAdmin) {
        ({ resources } = await container.items
          .query('SELECT c.id, c.documentId, c.documentName, c.buildingId, c.documentFileName FROM c ORDER BY c.documentId')
          .fetchAll());
      } else {
        const buildingIds = await getBuildingIdsForUser(caller.userId);
        if (buildingIds.length === 0) {
          context.res = { status: 200, body: [] };
          return;
        }
        const idList = buildingIds.map((_, i) => `@bid${i}`).join(', ');
        const parameters = buildingIds.map((id, i) => ({ name: `@bid${i}`, value: id }));
        ({ resources } = await container.items
          .query({ query: `SELECT c.id, c.documentId, c.documentName, c.buildingId, c.documentFileName FROM c WHERE c.buildingId IN (${idList}) ORDER BY c.documentId`, parameters })
          .fetchAll());
      }
      context.res = { status: 200, body: resources };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // GET single document with file – via query param ?id=xxx&download=true
  // (handled by checking download flag on GET)

  // POST – create document (admin only)
  if (method === 'POST') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { documentName, buildingId, documentFile, documentFileName } = req.body || {};
    if (!documentName || !buildingId) {
      context.res = { status: 400, body: { message: 'documentName and buildingId are required.' } };
      return;
    }
    try {
      const container = await getContainer('Documents');
      const nextId = await getNextDocumentId(container);
      const newDoc = {
        id: uuidv4(),
        documentId: nextId,
        documentName,
        buildingId: Number(buildingId),
        documentFile: documentFile || '',
        documentFileName: documentFileName || '',
      };
      await container.items.create(newDoc);
      // Return without file content
      const { documentFile: _f, ...meta } = newDoc;
      context.res = { status: 201, body: meta };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // PUT – update document (admin only)
  if (method === 'PUT') {
    if (!caller.userAdmin) {
      context.res = { status: 403, body: { message: 'Access denied.' } };
      return;
    }
    const { id, documentName, buildingId, documentFile, documentFileName } = req.body || {};
    if (!id) {
      context.res = { status: 400, body: { message: 'id is required.' } };
      return;
    }
    try {
      const container = await getContainer('Documents');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Document not found.' } };
        return;
      }
      const existing = resources[0];
      const updated = {
        ...existing,
        documentName: documentName ?? existing.documentName,
        buildingId: buildingId !== undefined ? Number(buildingId) : existing.buildingId,
        documentFile: documentFile ?? existing.documentFile,
        documentFileName: documentFileName ?? existing.documentFileName,
      };
      await container.items.upsert(updated);
      const { documentFile: _f, ...meta } = updated;
      context.res = { status: 200, body: meta };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  // DELETE – delete document (admin only)
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
      const container = await getContainer('Documents');
      const { resources } = await container.items.query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] }).fetchAll();
      if (resources.length === 0) {
        context.res = { status: 404, body: { message: 'Document not found.' } };
        return;
      }
      await container.item(id, resources[0].buildingId).delete();
      context.res = { status: 200, body: { message: 'Document deleted.' } };
    } catch (err) {
      context.res = { status: 500, body: { message: err.message } };
    }
    return;
  }

  context.res = { status: 405, body: { message: 'Method not allowed.' } };
};
