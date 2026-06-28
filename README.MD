# Task Flow

Aplicacion web de tareas con frontend en React y backend API en Flask.

## Stack

- Frontend: React + Vite + React Router DOM
- Backend: Python + Flask
- Base de datos: MySQL
- Deploy local simple: Flask sirve el build de React desde `static/`

## Credenciales de prueba

- Usuario: `usuario1`
- Contrasena: `123`

## Configuracion MySQL

Si no defines variables de entorno, la app usa:

- `MYSQL_HOST=localhost`
- `MYSQL_PORT=3306`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=joaco04`
- `MYSQL_DB=Tareas`

La base y las tablas se crean automaticamente al iniciar. El backend reintenta la conexion a MySQL en el arranque y corrige diferencias comunes de esquema antes de levantar la API.

Si quieres revisar el esquema desde Workbench, usa [init.sql](/C:/Users/joaqu/Desktop/Task/db/init.sql).

## Correr localmente

### Levantar la app

```powershell
scripts\iniciar.bat
```

O manualmente:

```powershell
pip install -r requirements.txt
python api.py
```

La app queda en [http://localhost:5000](http://localhost:5000).

## Trabajar el frontend React

El codigo fuente del frontend esta en `frontend/`. La app usa `react-router-dom` y esta separada en `pages`, `components`, `hooks`, `services`, `contexts` y `router`.

Flask no ejecuta React en vivo: sirve el build generado en `static/`.

Si cambias archivos dentro de `frontend/`, vuelve a compilar:

```powershell
cd frontend
pnpm install
node .\node_modules\vite\bin\vite.js build
```

## Ver tareas en Workbench

```sql
USE Tareas;

SELECT
    t.id,
    t.nombreTarea,
    t.descripcion,
    t.prioridad,
    t.fechaLimite,
    u.nombre AS usuario
FROM tareas t
JOIN usuario u ON u.id = t.usuario_id
ORDER BY t.id;
```

## Docker

```bash
docker compose up --build
```

## Salud de base

Puedes comprobar el estado de la conexion con:

```text
GET /health/db
```

## Estructura

```text
task/
|-- db/
|   `-- init.sql
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- router/
|   |   `-- services/
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- scripts/
|   |-- iniciar.bat
|   `-- iniciar.ps1
|-- static/
|   `-- assets/   # salida del build de React
|-- api.py
|-- Dockerfile
`-- requirements.txt
```
