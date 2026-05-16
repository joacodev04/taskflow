# Task Flow

Aplicacion web simple para gestionar tareas con login y panel de administracion.

## Credenciales de prueba

- Usuario: `usuario1`
- Contrasena: `123`

## Tecnologias

- Backend: Python + Flask
- Frontend: HTML, CSS, JavaScript
- Base de datos: MySQL
- Contenedor: Docker

## Configuracion MySQL

La app usa estas variables de entorno. Si no defines nada, arranca con estos valores:

- `MYSQL_HOST=localhost`
- `MYSQL_PORT=3306`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=joaco04`
- `MYSQL_DB=Tareas`

La base y las tablas se crean automaticamente al iniciar la app. Si prefieres hacerlo desde Workbench, abre [init.sql](/C:/Users/joaqu/Desktop/Task/db/init.sql).

## Correr localmente

### Opcion 1: script incluido

Ejecuta:

```powershell
scripts\iniciar.bat
```

### Opcion 2: manual

Instala dependencias y luego ejecuta:

```powershell
pip install -r requirements.txt
python api.py
```

La app queda disponible en [http://localhost:5000](http://localhost:5000).

## Ver las tareas en Workbench

Una vez creada una tarea, puedes consultarla con:

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
docker build -t task-flow .
docker run -p 5000:5000 task-flow
```

## Estructura

```text
task/
|-- db/
|   `-- init.sql
|-- scripts/
|   |-- iniciar.bat
|   `-- iniciar.ps1
|-- static/
|   |-- admin.html
|   |-- index.html
|   |-- style.css
|   `-- js/
|       |-- admin.js
|       `-- main.js
|-- api.py
|-- Dockerfile
`-- requirements.txt
```
