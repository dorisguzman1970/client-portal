module.exports = async function (context, req) {
  const email = (req.body?.email || "").toLowerCase();

  if (!email) {
    context.res = { status: 400, body: { message: "Email requerido" } };
    return;
  }

  // Ejemplo: lista blanca
  const allowed = ["tu@empresa.com"];

  if (!allowed.includes(email)) {
    context.res = { status: 401, body: { message: "No autorizado" } };
    return;
  }

  context.res = { status: 200, body: { status: "ok" } };
  if (req.method === "GET") {
  context.res = { status: 200, body: { ok: true, message: "API alive. Use POST with {email}." } };
  return;
}
};