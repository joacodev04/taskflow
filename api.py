import os
from contextlib import closing
from datetime import date, timedelta

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DEFAULT_USERNAME = os.environ.get("TASKFLOW_DEMO_USERNAME", "usuario1")
DEFAULT_PASSWORD = os.environ.get("TASKFLOW_DEMO_PASSWORD", "123")
PRIORIDADES_VALIDAS = {"urgente", "importante", "deseable"}
MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER", "root"),
    "passwd": os.environ.get("MYSQL_PASSWORD", "joaco04"),
    "db": os.environ.get("MYSQL_DB", "Tareas"),
    "charset": "utf8mb4",
}

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY",
    "taskflow_secreto_desarrollo_cambiar_en_produccion_2026",
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
app.config["JWT_VERIFY_SUB"] = False

jwt = JWTManager(app)


def get_mysql_driver():
    import_errors = []

    try:
        import pymysql
        from pymysql.cursors import DictCursor

        return pymysql, DictCursor
    except Exception as exc:
        import_errors.append(f"PyMySQL: {exc}")

    try:
        import MySQLdb
        from MySQLdb.cursors import DictCursor

        return MySQLdb, DictCursor
    except Exception as exc:
        import_errors.append(f"mysqlclient/MySQLdb: {exc}")

    joined_errors = " | ".join(import_errors) if import_errors else "sin detalles"
    raise RuntimeError(
        "No se encontro un driver MySQL compatible. "
        "Instala PyMySQL (recomendado) o mysqlclient. "
        f"Detalles: {joined_errors}"
    )


def open_connection(use_database=True):
    driver, dict_cursor = get_mysql_driver()
    connection_args = {
        "host": MYSQL_CONFIG["host"],
        "port": MYSQL_CONFIG["port"],
        "user": MYSQL_CONFIG["user"],
        "passwd": MYSQL_CONFIG["passwd"],
        "charset": MYSQL_CONFIG["charset"],
        "cursorclass": dict_cursor,
    }

    if use_database:
        connection_args["db"] = MYSQL_CONFIG["db"]

    connection = driver.connect(**connection_args)
    connection.autocommit(False)
    return connection


def ensure_database():
    with closing(open_connection(use_database=False)) as conn:
        with closing(conn.cursor()) as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_CONFIG['db']}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()


def ensure_schema():
    with closing(open_connection()) as conn:
        with closing(conn.cursor()) as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS usuario (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(120) NOT NULL UNIQUE,
                    contrasenia VARCHAR(255) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS tareas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombreTarea VARCHAR(255) NOT NULL,
                    descripcion TEXT NOT NULL,
                    prioridad ENUM('urgente', 'importante', 'deseable') NOT NULL,
                    fechaLimite DATE NULL,
                    usuario_id INT NOT NULL,
                    CONSTRAINT fk_tareas_usuario
                        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
                        ON DELETE CASCADE,
                    CONSTRAINT uq_tarea_usuario UNIQUE (nombreTarea, usuario_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            cur.execute(
                """
                ALTER TABLE usuario
                MODIFY nombre VARCHAR(120) NOT NULL,
                MODIFY contrasenia VARCHAR(255) NOT NULL
                """
            )
            cur.execute(
                """
                ALTER TABLE tareas
                MODIFY nombreTarea VARCHAR(255) NOT NULL,
                MODIFY descripcion TEXT NOT NULL,
                MODIFY fechaLimite DATE NULL
                """
            )
            cur.execute("SELECT id FROM usuario WHERE nombre = %s", (DEFAULT_USERNAME,))
            if cur.fetchone() is None:
                cur.execute(
                    "INSERT INTO usuario (nombre, contrasenia) VALUES (%s, %s)",
                    (DEFAULT_USERNAME, generate_password_hash(DEFAULT_PASSWORD)),
                )
        conn.commit()


def init_db():
    ensure_database()
    ensure_schema()


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
    init_db()
except Exception as exc:
    raise RuntimeError(
        "No se pudo inicializar MySQL. Verifica que el servidor este levantado "
        f"y revisa MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD y MYSQL_DB. "
        f"Configuracion actual: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['db']}"
    ) from exc


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


@app.get("/")
def serve_index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/admin.html")
def serve_admin():
    return send_from_directory(STATIC_DIR, "admin.html")


@app.get("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG") == "1"
    port = int(os.environ.get("PORT", "5000"))
    app.run(debug=debug_mode, host="0.0.0.0", port=port, use_reloader=debug_mode)
