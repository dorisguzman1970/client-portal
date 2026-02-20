import azure.functions as func
import logging
import json
import re

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="me", methods=["POST"])
def me(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('me function processed a request.')

    # Obtener email desde query o body
    email = req.params.get('email')
    if not email:
        try:
            req_body = req.get_json()
        except ValueError:
            req_body = None
        if req_body:
            email = req_body.get('email')

    # Validar formato de email con regex
    if email:
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if re.match(pattern, email):
            return func.HttpResponse(
                json.dumps({"status": "ok"}),
                status_code=200,
                mimetype="application/json"
            )
        else:
            return func.HttpResponse(
                json.dumps({"status": "error", "message": "Formato de email inválido"}),
                status_code=400,
                mimetype="application/json"
            )
    else:
        return func.HttpResponse(
            json.dumps({"status": "error", "message": "Debe proporcionar un email"}),
            status_code=400,
            mimetype="application/json"
        )
