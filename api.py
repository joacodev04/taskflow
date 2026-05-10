import json
import os
from datetime import timedelta
import bcrypt
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from flask_restful import Api, Resource
 
 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, "data", "users.json")
TASKS_FILE = os.path.join(BASE_DIR, "data", "lista.json")
 
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
 
 
def cargar_json(ruta):
    with open(ruta, "r", encoding="utf-8") as archivo:
        return json.load(archivo)
 
 
def guardar_json(ruta, contenido):
    with open(ruta, "w", encoding="utf-8") as archivo:
        json.dump(contenido, archivo, indent=4, ensure_ascii=False)
 
 
def cargar_usuarios():
    return cargar_json(USERS_FILE)
 
 
def cargar_tareas():
    return cargar_json(TASKS_FILE)
 
 
def guardar_tareas(tareas):
    guardar_json(TASKS_FILE, tareas)
 
 
def verificar_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
 
 
def encriptar_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
 
 
def siguiente_id(registros):
    if not registros:
        return "1"
    return str(max(int(clave) for clave in registros.keys()) + 1)
 
 
def buscar_tarea_por_nombre(tareas, nombre):
    nombre_normalizado = nombre.strip().casefold()
    for tarea_id, tarea in tareas.items():
        tarea_actual = tarea.get("tarea", "").strip().casefold()
        if tarea_actual == nombre_normalizado:
            return tarea_id, tarea
    return None, None
 
 
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
 
        usuarios = cargar_usuarios()
        usuario = usuarios.get(username)
 
        if not usuario or not verificar_password(password, usuario["password"]):
            return {"message": "Credenciales inválidas."}, 401
 
        role = usuario["role"]
        access_token = create_access_token(identity={"username": username, "role": role})
        return {"access_token": access_token, "role": role}, 200
 
 
class Usuario(Resource):
    @jwt_required()
    def get(self):
        current_user = get_jwt_identity()
        tareas = cargar_tareas()
        return {"message": f"Hola {current_user['username']}", "tareas": tareas}, 200
 
 
class CargarObjeto(Resource):
    @jwt_required()
    def get(self):
        return cargar_tareas(), 200
 
 
class AgregarObjeto(Resource):
    @jwt_required()
    def post(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        nombre = (data.get("nombre") or "").strip()
        descripcion = (data.get("descripcion") or "").strip()
 
        if not nombre or not descripcion:
            return {"message": "Faltan datos."}, 400
 
        objetos = cargar_tareas()
        if any(objeto.get("nombre", "").strip().casefold() == nombre.casefold() for objeto in objetos.values()):
            return {"message": "Ya existe ese objeto."}, 400
 
        objeto_id = siguiente_id(objetos)
        objetos[objeto_id] = {
            "nombre": nombre,
            "descripcion": descripcion,
            "creador": current_user["username"]
        }
        guardar_tareas(objetos)
        return {"message": f"Objeto {nombre} registrado."}, 201
 
 
class Crud(Resource):
    @jwt_required()
    def post(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea = (data.get("tarea") or "").strip()
        prioridad = (data.get("prioridad") or "").strip()
        descripcion = (data.get("descripcion") or "").strip()
        fecha_limite = (data.get("fecha_limite") or "").strip()
 
        if not tarea or not prioridad:
            return {"message": "Faltan datos: tarea o prioridad."}, 400
 
        prioridades_validas = {"Urgente", "Importante", "Deseable"}
        if prioridad not in prioridades_validas:
            return {"message": "Prioridad inválida. Debe ser Urgente, Importante o Deseable."}, 400
 
        tareas = cargar_tareas()
        _, tarea_existente = buscar_tarea_por_nombre(tareas, tarea)
        if tarea_existente:
            return {"message": "Ya existe una tarea con ese nombre."}, 400
 
        tarea_id = siguiente_id(tareas)
        tareas[tarea_id] = {
            "tarea": tarea,
            "creador": current_user["username"],
            "prioridad": prioridad,
            "descripcion": descripcion,
            "fecha_limite": fecha_limite
        }
        guardar_tareas(tareas)
        return {"message": f"Tarea {tarea} registrada."}, 201
 
    @jwt_required()
    def patch(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea = (data.get("tarea") or "").strip()
        nuevo = (data.get("nuevo") or "").strip()
        nueva_descripcion = (data.get("nueva_descripcion") or "").strip()
        nueva_fecha = (data.get("nueva_fecha") or "").strip()
 
        if not tarea or not nuevo:
            return {"message": "Completá la tarea actual y el nuevo nombre."}, 400
 
        tareas = cargar_tareas()
        tarea_id, tarea_encontrada = buscar_tarea_por_nombre(tareas, tarea)
 
        if not tarea_encontrada:
            return {"message": "Tarea no encontrada."}, 404
 
        if current_user["role"] != "administrador" and tarea_encontrada.get("creador") != current_user["username"]:
            return {"message": "No tenés permiso para modificar esta tarea."}, 403
 
        tarea_duplicada_id, tarea_duplicada = buscar_tarea_por_nombre(tareas, nuevo)
        if tarea_duplicada and tarea_duplicada_id != tarea_id:
            return {"message": "Ya existe una tarea con ese nombre."}, 400
 
        tarea_encontrada["tarea"] = nuevo
        if nueva_descripcion:
            tarea_encontrada["descripcion"] = nueva_descripcion
        if nueva_fecha:
            tarea_encontrada["fecha_limite"] = nueva_fecha
 
        guardar_tareas(tareas)
        return {"message": f"Tarea {tarea} modificada."}, 200
 
    @jwt_required()
    def delete(self):
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        tarea = (data.get("tarea") or "").strip()
 
        if not tarea:
            return {"message": "Ingresá la tarea a eliminar."}, 400
 
        tareas = cargar_tareas()
        tarea_id, tarea_encontrada = buscar_tarea_por_nombre(tareas, tarea)
 
        if not tarea_encontrada:
            return {"message": "Tarea no encontrada."}, 404
 
        if current_user["role"] != "administrador" and tarea_encontrada.get("creador") != current_user["username"]:
            return {"message": "No tenés permiso para eliminar esta tarea."}, 403
 
        tareas.pop(tarea_id)
 
        tareas_reordenadas = {}
        for nuevo_id, valor in enumerate(tareas.values(), start=1):
            tareas_reordenadas[str(nuevo_id)] = valor
        tareas = tareas_reordenadas
 
        guardar_tareas(tareas)
        return {"message": f"Tarea {tarea} eliminada."}, 200
 
 
class Admin(Resource):
    @jwt_required()
    def get(self):
        current_user = get_jwt_identity()
        if current_user["role"] != "administrador":
            return {"message": "Acceso denegado."}, 403
        return {"message": "Acceso autorizado."}, 200
 
 
api.add_resource(Login, "/login", endpoint="login")
api.add_resource(Usuario, "/usuario")
api.add_resource(CargarObjeto, "/cargarobjeto")
api.add_resource(Crud, "/crud")
api.add_resource(Admin, "/admin")
 
 
@app.route("/")
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "index.html")
 
 
@app.route("/usuario.html")
def serve_usuario():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "usuario.html")
 
 
@app.route("/admin.html")
def serve_admin():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "admin.html")
 
 
@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.path.join(BASE_DIR, "static"), filename)
 
 
if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000, use_reloader=debug_mode)