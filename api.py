import os
from contextlib import closing
from datetime import date, timedelta

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_database_target, initialize_database, open_connection, ping_database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DEFAULT_USERNAME = os.environ.get("TASKFLOW_DEMO_USERNAME", "usuario1")
DEFAULT_PASSWORD = os.environ.get("TASKFLOW_DEMO_PASSWORD", "123")
PRIORIDADES_VALIDAS = {"urgente", "importante", "deseable"}

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY",
    "taskflow_secreto_desarrollo_cambiar_en_produccion_2026",
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
app.config["JWT_VERIFY_SUB"] = False

jwt = JWTManager(app)


def get_user_by_username(cursor, username):
    cursor.execute(
        "SELECT id, nombre, contrasenia FROM usuario WHERE nombre = %s",
        (username,),
    )
    return cursor.fetchone()


def get_current_username():
    identity = get_jwt_identity() or {}
    return identity.get("username", "")


def normalize_priority(value):
    return (value or "").strip().lower()


def parse_date_or_none(value):
    raw_value = (value or "").strip()
    if not raw_value:
        return None

    try:
        date.fromisoformat(raw_value)
    except ValueError as exc:
        raise ValueError("Fecha limite invalida. Usa formato YYYY-MM-DD.") from exc

    return raw_value


def verify_password(password, stored_password):
    if not stored_password:
        return False, False

    try:
        if check_password_hash(stored_password, password):
            return True, False
    except ValueError:
        pass

    if stored_password.startswith("$2"):
        try:
            import bcrypt

            if bcrypt.checkpw(password.encode("utf-8"), stored_password.encode("utf-8")):
                return True, True
        except Exception:
            pass

    if stored_password == password:
        return True, True

    return False, False


try:
    initialize_database(DEFAULT_USERNAME, DEFAULT_PASSWORD)
except Exception as exc:
    raise RuntimeError(str(exc) or f"No se pudo inicializar MySQL: {get_database_target()}") from exc


@app.get("/health/db")
def health_db():
    try:
        ping_database()
    except Exception as exc:
        return jsonify(status="error", target=get_database_target(), message=str(exc)), 503

    return jsonify(status="ok", target=get_database_target()), 200


@app.post("/login")
@jwt_required(optional=True)
def login():
    usuario_actual = get_current_username()
    if usuario_actual:
        return jsonify(message="El usuario ya inicio sesion."), 400

    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify(message="Completa usuario y contrasena."), 400

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            usuario = get_user_by_username(cur, username)
            if usuario is None:
                return jsonify(message="Credenciales invalidas."), 401

            password_ok, should_upgrade = verify_password(password, usuario["contrasenia"])
            if not password_ok:
                return jsonify(message="Credenciales invalidas."), 401

            if should_upgrade:
                cur.execute(
                    "UPDATE usuario SET contrasenia = %s WHERE id = %s",
                    (generate_password_hash(password), usuario["id"]),
                )
                conn.commit()

    access_token = create_access_token(identity={"username": username})
    return jsonify(access_token=access_token), 200


@app.post("/registro")
def registro():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify(message="Completa usuario y contrasena."), 400

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            if get_user_by_username(cur, username) is not None:
                return jsonify(message="El usuario ya existe."), 400

            cur.execute(
                "INSERT INTO usuario (nombre, contrasenia) VALUES (%s, %s)",
                (username, generate_password_hash(password)),
            )
        conn.commit()

    return jsonify(message="Usuario registrado."), 201


@app.get("/cargarobjeto")
@jwt_required()
def cargar_objeto():
    username = get_current_username()

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            usuario = get_user_by_username(cur, username)
            if usuario is None:
                return jsonify(message="Usuario no encontrado."), 404

            cur.execute(
                """
                SELECT id, nombreTarea, descripcion, prioridad, fechaLimite
                FROM tareas
                WHERE usuario_id = %s
                ORDER BY id
                """,
                (usuario["id"],),
            )
            filas = cur.fetchall()

    tareas = {
        fila["id"]: {
            "tarea": fila["nombreTarea"],
            "descripcion": fila["descripcion"],
            "prioridad": fila["prioridad"],
            "fecha_limite": fila["fechaLimite"].isoformat() if fila["fechaLimite"] else "",
        }
        for fila in filas
    }
    return jsonify(tareas), 200


@app.post("/crud")
@jwt_required()
def crear_tarea():
    username = get_current_username()
    data = request.get_json() or {}
    tarea = (data.get("tarea") or "").strip()
    prioridad = normalize_priority(data.get("prioridad"))
    descripcion = (data.get("descripcion") or "").strip()

    try:
        fecha_limite = parse_date_or_none(data.get("fecha_limite"))
    except ValueError as exc:
        return jsonify(message=str(exc)), 400

    if not tarea or not prioridad:
        return jsonify(message="Faltan datos: tarea o prioridad."), 400

    if prioridad not in PRIORIDADES_VALIDAS:
        return jsonify(message="Prioridad invalida."), 400

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            usuario = get_user_by_username(cur, username)
            if usuario is None:
                return jsonify(message="Usuario no encontrado."), 404

            cur.execute(
                "SELECT id FROM tareas WHERE nombreTarea = %s AND usuario_id = %s",
                (tarea, usuario["id"]),
            )
            if cur.fetchone() is not None:
                return jsonify(message="Ya existe una tarea con ese nombre."), 400

            cur.execute(
                """
                INSERT INTO tareas (nombreTarea, descripcion, prioridad, fechaLimite, usuario_id)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (tarea, descripcion, prioridad, fecha_limite, usuario["id"]),
            )
        conn.commit()

    return jsonify(message=f"Tarea {tarea} registrada."), 201


@app.patch("/crud")
@jwt_required()
def modificar_tarea():
    username = get_current_username()
    data = request.get_json() or {}
    tarea_id = data.get("id")
    nuevo = (data.get("nuevo") or "").strip()
    nueva_descripcion = (data.get("nueva_descripcion") or "").strip()

    try:
        nueva_fecha = parse_date_or_none(data.get("nueva_fecha"))
    except ValueError as exc:
        return jsonify(message=str(exc)), 400

    if not tarea_id or not nuevo:
        return jsonify(message="Completa el id y el nuevo nombre."), 400

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            usuario = get_user_by_username(cur, username)
            if usuario is None:
                return jsonify(message="Usuario no encontrado."), 404

            cur.execute(
                "SELECT id FROM tareas WHERE id = %s AND usuario_id = %s",
                (tarea_id, usuario["id"]),
            )
            if cur.fetchone() is None:
                return jsonify(message="Tarea no encontrada o sin permiso."), 404

            cur.execute(
                """
                SELECT id
                FROM tareas
                WHERE nombreTarea = %s AND usuario_id = %s AND id <> %s
                """,
                (nuevo, usuario["id"], tarea_id),
            )
            if cur.fetchone() is not None:
                return jsonify(message="Ya existe una tarea con ese nombre."), 400

            cur.execute(
                """
                UPDATE tareas
                SET nombreTarea = %s, descripcion = %s, fechaLimite = %s
                WHERE id = %s AND usuario_id = %s
                """,
                (nuevo, nueva_descripcion, nueva_fecha, tarea_id, usuario["id"]),
            )
        conn.commit()

    return jsonify(message="Tarea modificada."), 200


@app.delete("/crud")
@jwt_required()
def eliminar_tarea():
    username = get_current_username()
    data = request.get_json() or {}
    tarea_id = data.get("id")

    if not tarea_id:
        return jsonify(message="Ingresa el id de la tarea."), 400

    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            usuario = get_user_by_username(cur, username)
            if usuario is None:
                return jsonify(message="Usuario no encontrado."), 404

            cur.execute(
                "SELECT id FROM tareas WHERE id = %s AND usuario_id = %s",
                (tarea_id, usuario["id"]),
            )
            if cur.fetchone() is None:
                return jsonify(message="Tarea no encontrada o sin permiso."), 404

            cur.execute(
                "DELETE FROM tareas WHERE id = %s AND usuario_id = %s",
                (tarea_id, usuario["id"]),
            )
        conn.commit()

    return jsonify(message="Tarea eliminada."), 200


def serve_frontend_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.isfile(index_path):
        abort(503, description="El frontend React no esta construido.")

    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/", defaults={"requested_path": ""})
@app.get("/<path:requested_path>")
def serve_frontend(requested_path):
    if requested_path in {"", "admin.html"}:
        return serve_frontend_index()

    file_path = os.path.join(STATIC_DIR, requested_path)
    if requested_path and os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, requested_path)

    if "." in os.path.basename(requested_path):
        abort(404)

    return serve_frontend_index()


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG") == "1"
    port = int(os.environ.get("PORT", "5000"))
    app.run(debug=debug_mode, host="0.0.0.0", port=port, use_reloader=debug_mode)
