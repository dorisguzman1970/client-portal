/**
 * Parses the Azure Static Web Apps client principal header.
 * Returns { userEmail, userId } or null if not authenticated.
 */
function getPrincipal(req) {
  const header = req.headers['x-ms-client-principal'];
  if (!header) return null;
  try {
    const principal = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    return {
      userEmail: (principal.userDetails || '').toLowerCase(),
      userId: principal.userId || null,
    };
  } catch {
    return null;
  }
}

module.exports = { getPrincipal };
