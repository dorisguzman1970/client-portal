module.exports = async function (context, req) {
  const email = (req.body && req.body.email) || (req.query && req.query.email);

  if (!email) {
    context.res = { status: 400, body: { status: "error", message: "Debe proporcionar un email" } };
    return;
  }

  // validación simple
  const pattern = /^[\w.-]+@[\w.-]+\.\w+$/;
  if (!pattern.test(email)) {
    context.res = { status: 400, body: { status: "error", message: "Formato de email inválido" } };
    return;
  }

  context.res = { status: 200, body: { status: "ok" } };
};