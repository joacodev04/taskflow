import os
from datetime import timedelta
import bcrypt
from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from flask_restful import Api, Resource
from flask_mysqldb import MySQL

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)
api = Api(app)

app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY",
    "taskflow_secreto_desarrollo_cambiar_en_produccion_2026"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
app.config["JWT_VERIFY_SUB"] = False

jwt = JWTManager(app)

# Configuración de la base de datos
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'joaco04'
app.config['MYSQL_DB'] = 'Tareas'

mysql = MySQL(app)

def verificar_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def encriptar_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


class Login(Resource):
    @jwt_required(optional=True)
    def post(self):
        usuario_actual = get_jwt_identity()
        if usuario_actual:
            return {"message": "El usuario ya inició sesión."}, 400

        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return {"message": "Completá usuario y contraseña."}, 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT nombre, contrasenia FROM usuario WHERE nombre = %s", (username,))
        usuario = cur.fetchone()
        cur.close()

        if not usuario or not verificar_password(password, usuario[1]):
            return {"message": "Credenciales inválidas."}, 401

        access_token = create_access_token(identity={"username": username})
        return {"access_token": access_token}, 200


class Registro(Resource):
    def post(self):
        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if not username or not password:
            return {"message": "Completá usuario y contraseña."}, 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT nombre FROM usuario WHERE nombre = %s", (username,))
        existe = cur.fetchone()

        if existe:
            cur.close()
            return {"message": "El usuario ya existe."}, 400

        contrasenia_hash = encriptar_password(password)
        cur.execute("INSERT INTO usuario (nombre, contrasenia) VALUES (%s, %s)", (username, contrasenia_hash))
        mysql.connection.commit()
        cur.close()
        return {"message": "Usuario registrado."}, 201


class CargarObjeto(Resource):
    @jwt_required()
    def get(self):
        current_user = get_jwt_identity()
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombreTarea, descripcion, prioridad, fechaLimite FROM tareas WHERE usuario_id = (SELECT id FROM usuario WHERE nombre = %s)", (current_user["username"],))
        filas = cur.fetchall()
        cur.close()
        tareas = {}
        for fila in filas:
            tareas[fila[0]] = {
                "tarea": fila[1],
                "descripcion": fila[2],
                "prioridad": fila[3],
                "fecha_limite": str(fila[4]) if fila[4] else ""
            }
        return tareas, 200


class Crud(Resource):
    @jwt_required()
    def post(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea = (data.get("tarea") or "").strip()
        prioridad = (data.get("prioridad") or "").strip()
        descripcion = (data.get("descripcion") or "").strip()
        fecha_limite = (data.get("fecha_limite") or "").strip() or None

        if not tarea or not prioridad:
            return {"message": "Faltan datos: tarea o prioridad."}, 400

        prioridades_validas = {"urgente", "importante", "deseable"}
        if prioridad.lower() not in prioridades_validas:
            return {"message": "Prioridad inválida."}, 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM usuario WHERE nombre = %s", (current_user["username"],))
        usuario = cur.fetchone()
        usuario_id = usuario[0]

        cur.execute("SELECT id FROM tareas WHERE nombreTarea = %s AND usuario_id = %s", (tarea, usuario_id))
        if cur.fetchone():
            cur.close()
            return {"message": "Ya existe una tarea con ese nombre."}, 400

        cur.execute(
            "INSERT INTO tareas (nombreTarea, descripcion, prioridad, fechaLimite, usuario_id) VALUES (%s, %s, %s, %s, %s)",
            (tarea, descripcion, prioridad, fecha_limite, usuario_id)
        )
        mysql.connection.commit()
        cur.close()
        return {"message": f"Tarea {tarea} registrada."}, 201

    @jwt_required()
    def patch(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea_id = data.get("id")
        nuevo = (data.get("nuevo") or "").strip()
        nueva_descripcion = (data.get("nueva_descripcion") or "").strip()
        nueva_fecha = (data.get("nueva_fecha") or "").strip() or None

        if not tarea_id or not nuevo:
            return {"message": "Completá el id y el nuevo nombre."}, 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM usuario WHERE nombre = %s", (current_user["username"],))
        usuario = cur.fetchone()
        usuario_id = usuario[0]

        cur.execute("SELECT id FROM tareas WHERE id = %s AND usuario_id = %s", (tarea_id, usuario_id))
        if not cur.fetchone():
            cur.close()
            return {"message": "Tarea no encontrada o sin permiso."}, 404

        cur.execute(
            "UPDATE tareas SET nombreTarea = %s, descripcion = %s, fechaLimite = %s WHERE id = %s",
            (nuevo, nueva_descripcion, nueva_fecha, tarea_id)
        )
        mysql.connection.commit()
        cur.close()
        return {"message": "Tarea modificada."}, 200

    @jwt_required()
    def delete(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea_id = data.get("id")

        if not tarea_id:
            return {"message": "Ingresá el id de la tarea."}, 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM usuario WHERE nombre = %s", (current_user["username"],))
        usuario = cur.fetchone()
        usuario_id = usuario[0]

        cur.execute("SELECT id FROM tareas WHERE id = %s AND usuario_id = %s", (tarea_id, usuario_id))
        if not cur.fetchone():
            cur.close()
            return {"message": "Tarea no encontrada o sin permiso."}, 404

        cur.execute("DELETE FROM tareas WHERE id = %s", (tarea_id,))
        mysql.connection.commit()
        cur.close()
        return {"message": "Tarea eliminada."}, 200


api.add_resource(Login, "/login", endpoint="login")
api.add_resource(Registro, "/registro")
api.add_resource(CargarObjeto, "/cargarobjeto")
api.add_resource(Crud, "/crud")


@app.route("/")
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "index.html")


@app.route("/usuario.html")
def serve_usuario():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "usuario.html")


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.path.join(BASE_DIR, "static"), filename)
 
if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000, use_reloader=debug_mode)