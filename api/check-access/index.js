const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

module.exports = async function (context, req) {
  const principal = getPrincipal(req);

  if (!principal || !principal.userEmail) {
    context.res = {
      status: 401,
      body: { authorized: false, message: 'Not authenticated.' },
    };
    return;
  }

  try {
    const container = await getContainer('Users');
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userEmail = @email',
        parameters: [{ name: '@email', value: principal.userEmail }],
      })
      .fetchAll();

    if (resources.length === 0) {
      context.res = {
        status: 403,
        body: {
          authorized: false,
          message: 'You are not authorized to access this application.',
        },
      };
      return;
    }

    const dbUser = resources[0];
    context.res = {
      status: 200,
      body: {
        authorized: true,
        userId: dbUser.userId,
        userName: dbUser.userName,
        userEmail: dbUser.userEmail,
        userAdmin: dbUser.userAdmin === true,
      },
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { authorized: false, message: 'Internal error: ' + err.message },
    };
  }
};
