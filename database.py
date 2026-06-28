import os
import time
from contextlib import closing

from werkzeug.security import generate_password_hash

MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER", "root"),
    "passwd": os.environ.get("MYSQL_PASSWORD", "joaco04"),
    "db": os.environ.get("MYSQL_DB", "Tareas"),
    "charset": "utf8mb4",
    "connect_timeout": int(os.environ.get("MYSQL_CONNECT_TIMEOUT", "5")),
}

INIT_CONFIG = {
    "max_attempts": int(os.environ.get("MYSQL_INIT_MAX_ATTEMPTS", "15")),
    "retry_seconds": float(os.environ.get("MYSQL_INIT_RETRY_SECONDS", "2")),
}


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


def get_database_target():
    return f"{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['db']}"


def open_connection(use_database=True):
    driver, dict_cursor = get_mysql_driver()
    connection_args = {
        "host": MYSQL_CONFIG["host"],
        "port": MYSQL_CONFIG["port"],
        "user": MYSQL_CONFIG["user"],
        "passwd": MYSQL_CONFIG["passwd"],
        "charset": MYSQL_CONFIG["charset"],
        "cursorclass": dict_cursor,
        "connect_timeout": MYSQL_CONFIG["connect_timeout"],
    }

    if use_database:
        connection_args["db"] = MYSQL_CONFIG["db"]

    connection = driver.connect(**connection_args)
    connection.autocommit(False)
    return connection


def ensure_database():
    with closing(open_connection(use_database=False)) as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_CONFIG['db']}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        connection.commit()


def ensure_index(cursor, table_name, index_name, create_statement):
    cursor.execute(f"SHOW INDEX FROM `{table_name}` WHERE Key_name = %s", (index_name,))
    if cursor.fetchone() is None:
        cursor.execute(create_statement)


def ensure_unique_index_if_possible(cursor, table_name, index_name, duplicates_query, create_statement):
    cursor.execute(f"SHOW INDEX FROM `{table_name}` WHERE Key_name = %s", (index_name,))
    if cursor.fetchone() is not None:
        return

    cursor.execute(duplicates_query)
    if cursor.fetchone() is None:
        cursor.execute(create_statement)


def ensure_schema(default_username, default_password):
    with closing(open_connection()) as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS usuario (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(120) NOT NULL,
                    contrasenia VARCHAR(255) NOT NULL,
                    UNIQUE KEY uq_usuario_nombre (nombre)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS tareas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombreTarea VARCHAR(255) NOT NULL,
                    descripcion TEXT NOT NULL,
                    prioridad ENUM('urgente', 'importante', 'deseable') NOT NULL,
                    fechaLimite DATE NULL,
                    usuario_id INT NOT NULL,
                    KEY idx_tareas_usuario_id (usuario_id),
                    CONSTRAINT fk_tareas_usuario
                        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
                        ON DELETE CASCADE,
                    CONSTRAINT uq_tarea_usuario UNIQUE (nombreTarea, usuario_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """
            )
            cursor.execute(
                """
                ALTER TABLE usuario
                MODIFY nombre VARCHAR(120) NOT NULL,
                MODIFY contrasenia VARCHAR(255) NOT NULL
                """
            )
            cursor.execute(
                """
                ALTER TABLE tareas
                MODIFY nombreTarea VARCHAR(255) NOT NULL,
                MODIFY descripcion TEXT NOT NULL,
                MODIFY fechaLimite DATE NULL
                """
            )

            ensure_unique_index_if_possible(
                cursor,
                "usuario",
                "uq_usuario_nombre",
                """
                SELECT nombre
                FROM usuario
                GROUP BY nombre
                HAVING COUNT(*) > 1
                LIMIT 1
                """,
                "ALTER TABLE usuario ADD UNIQUE INDEX uq_usuario_nombre (nombre)",
            )
            ensure_index(
                cursor,
                "tareas",
                "idx_tareas_usuario_id",
                "ALTER TABLE tareas ADD INDEX idx_tareas_usuario_id (usuario_id)",
            )
            ensure_unique_index_if_possible(
                cursor,
                "tareas",
                "uq_tarea_usuario",
                """
                SELECT nombreTarea, usuario_id
                FROM tareas
                GROUP BY nombreTarea, usuario_id
                HAVING COUNT(*) > 1
                LIMIT 1
                """,
                "ALTER TABLE tareas ADD UNIQUE INDEX uq_tarea_usuario (nombreTarea, usuario_id)",
            )

            cursor.execute("SELECT id FROM usuario WHERE nombre = %s", (default_username,))
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO usuario (nombre, contrasenia) VALUES (%s, %s)",
                    (default_username, generate_password_hash(default_password)),
                )
        connection.commit()


def initialize_database(default_username, default_password):
    last_error = None

    for attempt in range(1, INIT_CONFIG["max_attempts"] + 1):
        try:
            ensure_database()
            ensure_schema(default_username, default_password)
            return
        except Exception as exc:
            last_error = exc
            if attempt == INIT_CONFIG["max_attempts"]:
                break
            time.sleep(INIT_CONFIG["retry_seconds"])

    raise RuntimeError(
        "No se pudo inicializar MySQL. Verifica que el servidor este levantado "
        f"y revisa MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD y MYSQL_DB. "
        f"Configuracion actual: {get_database_target()}"
    ) from last_error


def ping_database():
    with closing(open_connection()) as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute("SELECT 1 AS ok")
            return cursor.fetchone()
