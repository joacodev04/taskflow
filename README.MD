# ✅ Task Flow

Una aplicación web de gestión de tareas con autenticación de usuarios y panel de administración.

## 🌐 Demo en vivo

👉 [Ver la app en Render](https://taskflow-bvr1.onrender.com)

> **Nota:** La app está hosteada en el plan gratuito de Render, por lo que puede tardar unos segundos en cargar la primera vez.

---

## 🔑 Credenciales de prueba

Usuario   | Contraseña
---------------------------
usuario1  | 123 

## ⚙️ Funcionalidades

- ✅ Crear, editar y eliminar tareas
- 🔐 Login(seguridad)

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Python |
| Frontend | HTML, CSS, JavaScript |
| Contenedor | Docker |
| Hosting | Render |



## 🚀 Correr localmente

# Ejecutá el script de inicio
scripts/iniciar.bat
```

### Opción 2 — Docker manual

```bash
docker build -t task-flow .
docker run -p 5000:5000 task-flow
```

Luego abrí tu navegador en `http://localhost:5000`

---

## 📁 Estructura del proyecto

```
task/
├── data/
│   ├── lista.json       # Almacenamiento de tareas
│   └── users.json       # Usuarios registrados
├── static/
│   ├── js/
│   │   ├── admin.js     # Lógica del panel admin
│   │   └── main.js      # Lógica principal
│   ├── admin.html       # Vista administrador
│   ├── index.html       # Vista principal
│   └── style.css        # Estilos
├── scripts/
│   └── iniciar.bat      # Script de inicio local
├── api.py               # API REST (backend)
├── Dockerfile
└── requirements.txt
```

---

## 👤 Autor

Hecho con ❤️ por Joaquin Murillo (https://github.com/joacodev04)