import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

function isValidEmail(email: string): boolean {
  // misma idea que tu Python :contentReference[oaicite:1]{index=1}
  const pattern = /^[\w.-]+@[\w.-]+\.\w+$/;
  return pattern.test(email);
}

export async function me(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("me function processed a request.");

  let email = req.query.get("email") ?? "";

  if (!email) {
    try {
      const body = (await req.json()) as any;
      email = (body?.email ?? "").toString();
    } catch {
      // body no era JSON
    }
  }

  if (!email) {
    return { status: 400, jsonBody: { status: "error", message: "Debe proporcionar un email" } };
  }

  if (!isValidEmail(email)) {
    return { status: 400, jsonBody: { status: "error", message: "Formato de email inválido" } };
  }

  return { status: 200, jsonBody: { status: "ok" } };
}

app.http("me", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "me",
  handler: me,
});