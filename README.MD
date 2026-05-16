# Task Flow

Aplicacion web simple para gestionar tareas con login y panel de administracion.

## Credenciales de prueba

- Usuario: `usuario1`
- Contrasena: `123`

Tambien se puede crear un username y password

## Tecnologias

- Backend: Python + Flask
- Frontend: HTML, CSS, JavaScript, Bootstrap
- Base de datos: MySQL
- Contenedor: Docker

## Correr localmente

### script incluido

Ejecuta:

```powershell
scripts\iniciar.bat
```

## Ver las tareas en Workbench

## Estructura

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
