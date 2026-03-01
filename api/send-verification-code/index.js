const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getPrincipal } = require('../auth-helper');
const { getContainer } = require('../cosmos');

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function parseConnectionString(connStr) {
  const parts = {};
  for (const part of connStr.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.substring(0, idx).toLowerCase();
      parts[key] = part.substring(idx + 1);
    }
  }
  return { endpoint: parts['endpoint'], accessKey: parts['accesskey'] };
}

function buildAcsHeaders(method, url, bodyStr, accessKey) {
  const contentHash = crypto.createHash('sha256').update(bodyStr).digest('base64');
  const date = new Date().toUTCString();
  const urlObj = new URL(url);
  const pathAndQuery = urlObj.pathname + urlObj.search;
  const host = urlObj.host;

  const stringToSign = `${method}\n${pathAndQuery}\n${date};${host};${contentHash}`;
  const signature = crypto
    .createHmac('sha256', Buffer.from(accessKey, 'base64'))
    .update(stringToSign)
    .digest('base64');

  return {
    'Content-Type': 'application/json',
    'x-ms-date': date,
    'x-ms-content-sha256': contentHash,
    Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
  };
}

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

    // Send email via ACS REST API (no npm package — uses built-in crypto + fetch)
    const connStr = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    const senderAddress = process.env.ACS_SENDER_ADDRESS;
    if (!connStr || !senderAddress) {
      context.res = { status: 500, body: { message: 'ACS not configured.' } };
      return;
    }

    const { endpoint, accessKey } = parseConnectionString(connStr);
    const url = `${endpoint}emails:send?api-version=2023-03-31`;
    const bodyObj = {
      senderAddress,
      recipients: { to: [{ address: email }] },
      content: {
        subject: 'Código de verificación - Portal',
        plainText: `Su código de verificación para el Portal es:\n\n${code}\n\nEste código es válido por 10 minutos.\n\nSi no solicitó este código, ignore este mensaje.`,
      },
    };
    const bodyStr = JSON.stringify(bodyObj);
    const headers = buildAcsHeaders('POST', url, bodyStr, accessKey);

    const acsRes = await fetch(url, { method: 'POST', headers, body: bodyStr });
    if (!acsRes.ok) {
      const errText = await acsRes.text();
      context.res = { status: 500, body: { message: 'Error sending email: ' + errText } };
      return;
    }

    context.res = { status: 200, body: { sent: true, email } };
  } catch (err) {
    context.res = { status: 500, body: { message: err.message } };
  }
};
