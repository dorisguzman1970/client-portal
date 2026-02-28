const { CosmosClient } = require('@azure/cosmos');

const connectionString = process.env.COSMOS_CONNECTION_STRING;

if (!connectionString) {
  console.warn('COSMOS_CONNECTION_STRING is not set. Database operations will fail.');
}

const client = connectionString ? new CosmosClient(connectionString) : null;
const database = client ? client.database('Portal') : null;

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
