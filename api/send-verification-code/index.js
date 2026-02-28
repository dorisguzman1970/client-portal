const { v4: uuidv4 } = require('uuid');
const { EmailClient } = require('@azure/communication-email');
const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

module.exports = async function (context, req) {
  const principal = getPrincipal(req);
  if (!principal || !principal.userEmail) {
    context.res = { status: 401, body: { message: 'Not authenticated.' } };
    return;
  }

  const email = principal.userEmail;

  try {
    const container = await getContainer('EmailVerifications');

    // Delete any existing codes for this email
    const { resources: existing } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }],
      })
      .fetchAll();
    for (const doc of existing) {
      await container.item(doc.id, doc.email).delete();
    }

    // Generate and store new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    await container.items.create({ id: uuidv4(), email, code, expiresAt, used: false });

    // Send email via Azure Communication Services
    const connStr = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    if (!connStr) {
      context.res = { status: 500, body: { message: 'AZURE_COMMUNICATION_CONNECTION_STRING not configured.' } };
      return;
    }

    const emailClient = new EmailClient(connStr);
    const poller = await emailClient.beginSend({
      senderAddress: process.env.ACS_SENDER_ADDRESS,
      recipients: { to: [{ address: email }] },
      content: {
        subject: 'Código de verificación - Portal',
        plainText: `Su código de verificación para el Portal es:\n\n${code}\n\nEste código es válido por 10 minutos.\n\nSi no solicitó este código, ignore este mensaje.`,
      },
    });
    await poller.pollUntilDone();

    context.res = { status: 200, body: { sent: true, email } };
  } catch (err) {
    context.res = { status: 500, body: { message: err.message } };
  }
};
