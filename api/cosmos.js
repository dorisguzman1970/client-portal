let CosmosClient;
try {
  CosmosClient = require('@azure/cosmos').CosmosClient;
} catch (e) {
  console.error('Failed to load @azure/cosmos:', e.message);
}

const connectionString = process.env.COSMOS_CONNECTION_STRING;

if (!connectionString) {
  console.warn('COSMOS_CONNECTION_STRING is not set. Database operations will fail.');
}

let client = null;
let database = null;
if (CosmosClient && connectionString) {
  try {
    client = new CosmosClient(connectionString);
    database = client.database('Portal');
  } catch (err) {
    console.error('CosmosClient init error:', err.message);
  }
}

async function getContainer(name) {
  if (!database) throw new Error('Cosmos DB not configured. Set COSMOS_CONNECTION_STRING.');
  return database.container(name);
}

async function getNextId(containerName) {
  const container = await getContainer(containerName);
  const { resources } = await container.items
    .query('SELECT VALUE MAX(c.id_num) FROM c')
    .fetchAll();
  const max = resources[0];
  return (max || 0) + 1;
}

module.exports = { client, database, getContainer, getNextId };
