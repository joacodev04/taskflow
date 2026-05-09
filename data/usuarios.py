from flask import Flask, request, send_from_directory
from flask_restful import Resource, Api
import bcrypt
import json
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from datetime import timedelta

app = Flask(__name__)
api = Api(app)

app.config["JWT_SECRET_KEY"] = "supersecreto"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
app.config['JWT_VERIFY_SUB'] = False

jwt = JWTManager(app)

archivo = "users.json"

usuarios = {
    "usuario1": {"password": "123", "role": "administrador"},
}

for usuario in usuarios:
    clave_sin_encriptar = usuarios[usuario]["password"]
    clave_encriptada = bcrypt.hashpw(clave_sin_encriptar.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    usuarios[usuario]["password"] = clave_encriptada

with open("users.json", "w") as archivo:
    json.dump(usuarios, archivo, indent=4, ensure_ascii = False)




if __name__ == "__main__":
    app.run(debug=True)