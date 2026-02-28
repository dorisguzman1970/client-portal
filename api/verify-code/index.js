const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

module.exports = async function (context, req) {
  const principal = getPrincipal(req);
  if (!principal || !principal.userEmail) {
    context.res = { status: 401, body: { message: 'Not authenticated.' } };
    return;
  }

  const email = principal.userEmail;
  const { code } = req.body || {};

  if (!code) {
    context.res = { status: 400, body: { verified: false, message: 'Code is required.' } };
    return;
  }

  try {
    const container = await getContainer('EmailVerifications');
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.email = @email AND c.code = @code AND c.used = false',
        parameters: [
          { name: '@email', value: email },
          { name: '@code', value: code },
        ],
      })
      .fetchAll();

    if (resources.length === 0) {
      context.res = { status: 400, body: { verified: false, message: 'Código inválido.' } };
      return;
    }

    const doc = resources[0];

    if (new Date(doc.expiresAt) < new Date()) {
      context.res = { status: 400, body: { verified: false, message: 'El código ha expirado. Solicite uno nuevo.' } };
      return;
    }

    await container.items.upsert({ ...doc, used: true });

    context.res = { status: 200, body: { verified: true } };
  } catch (err) {
    context.res = { status: 500, body: { message: err.message } };
  }
};
