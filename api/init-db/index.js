const { client } = require('../cosmos');

const DB_NAME = 'Portal';
const CONTAINERS = [
  { id: 'Users', partitionKey: '/userEmail' },
  { id: 'Clients', partitionKey: '/clientId' },
  { id: 'Buildings', partitionKey: '/buildingId' },
  { id: 'Documents', partitionKey: '/buildingId' },
  { id: 'Parameters', partitionKey: '/id' },
];

const DEFAULT_ADMIN = {
  id: 'user-default-admin',
  userId: 1,
  userName: 'su',
  userEmail: 'soralgroup@outlook.com',
  userAdmin: true,
};

module.exports = async function (context, req) {
  if (!client) {
    context.res = { status: 500, body: { message: 'COSMOS_CONNECTION_STRING is not configured.' } };
    return;
  }

  try {
    const { database } = await client.databases.createIfNotExists({ id: DB_NAME });
    const results = [];

    for (const c of CONTAINERS) {
      await database.containers.createIfNotExists({
        id: c.id,
        partitionKey: { paths: [c.partitionKey] },
      });
      results.push(`Container '${c.id}' ready.`);
    }

    // Seed default admin user (idempotent)
    const usersContainer = database.container('Users');
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.userEmail = @email', parameters: [{ name: '@email', value: DEFAULT_ADMIN.userEmail }] })
      .fetchAll();

    if (resources.length === 0) {
      await usersContainer.items.upsert(DEFAULT_ADMIN);
      results.push('Default admin user created.');
    } else {
      results.push('Default admin user already exists.');
    }

    context.res = { status: 200, body: { message: 'Database initialized.', details: results } };
  } catch (err) {
    context.res = {
      status: 500,
      body: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        connectionString: process.env.COSMOS_CONNECTION_STRING ? 'SET (length: ' + process.env.COSMOS_CONNECTION_STRING.length + ')' : 'NOT SET',
      },
    };
  }
};
