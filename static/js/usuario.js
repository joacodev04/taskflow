const API_BASE = window.location.origin;
const token = localStorage.getItem("access_token");

const userElements = {
    titulo: document.querySelector("#usuario_titulo"),
    subtitulo: document.querySelector("#usuario_subtitulo"),
    mensaje: document.querySelector("#usuario_mensaje"),
    lista: document.querySelector("#user_task_list"),
    estadoTabla: document.querySelector("#user_table_status"),
    total: document.querySelector("#user_metric_total"),
    urgent: document.querySelector("#user_metric_urgent"),
    important: document.querySelector("#user_metric_important"),
    desirable: document.querySelector("#user_metric_desirable")
};

function irInicio() {
    window.location.href = "/";
}

function cerrarSesion() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    irInicio();
}

function mostrarMensajeUsuario(mensaje, tipo = "danger") {
    userElements.mensaje.textContent = mensaje;
    userElements.mensaje.className = `message-box alert-${tipo}`;
    setTimeout(() => {
        userElements.mensaje.textContent = "";
        userElements.mensaje.className = "message-box";
    }, 3600);
}

function metricasUsuario(tareas) {
    const items = Object.values(tareas || {});
    userElements.total.textContent = String(items.length);
    userElements.urgent.textContent = String(items.filter(item => item.prioridad === "Urgente").length);
    userElements.important.textContent = String(items.filter(item => item.prioridad === "Importante").length);
    userElements.desirable.textContent = String(items.filter(item => item.prioridad === "Deseable").length);
    userElements.estadoTabla.textContent = items.length ? `${items.length} tareas disponibles` : "Sin tareas";
}

function renderizarTareasUsuario(tareas) {
    const items = Object.entries(tareas || {});
    userElements.lista.innerHTML = "";

    if (!items.length) {
        userElements.lista.innerHTML = '<div class="task-list-empty">No hay tareas cargadas por el momento.</div>';
        metricasUsuario({});
        return;
    }

    const table = document.createElement("table");
    table.className = "task-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Tarea</th>
                <th>Prioridad</th>
                <th>Creador</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    items.forEach(([id, tarea]) => {
        const prioridad = tarea.prioridad || "No especificada";
        const prioridadClase = prioridad.replace(/\s+/g, "-");
        const nombreTarea = tarea.tarea || "Sin nombre";
        const creador = tarea.creador || "Desconocido";
        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = id;

        const celdaTarea = document.createElement("td");
        const titulo = document.createElement("div");
        titulo.className = "task-title";
        titulo.textContent = nombreTarea;
        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.textContent = "Organizada para seguimiento diario";
        celdaTarea.append(titulo, meta);

        const celdaPrioridad = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `priority-label priority-${prioridadClase}`;
        badge.textContent = prioridad;
        celdaPrioridad.appendChild(badge);

        const celdaCreador = document.createElement("td");
        celdaCreador.textContent = creador;

        fila.append(celdaId, celdaTarea, celdaPrioridad, celdaCreador);
        tbody.appendChild(fila);
    });

    userElements.lista.appendChild(table);
    metricasUsuario(tareas);
}

async function cargarPanelUsuario() {
    if (!token) {
        irInicio();
        return;
    }

    userElements.estadoTabla.textContent = "Cargando...";

    try {
        const respuesta = await fetch(`${API_BASE}/usuario`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (respuesta.status === 401) {
            cerrarSesion();
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarMensajeUsuario(datos.message || "No se pudo cargar el panel.", "danger");
            userElements.estadoTabla.textContent = "Error";
            userElements.lista.innerHTML = '<div class="task-list-empty">No se pudieron cargar las tareas.</div>';
            return;
        }

        userElements.titulo.textContent = datos.message || "Hola";
        userElements.subtitulo.textContent = "Estas son las tareas actualmente registradas en el sistema.";
        renderizarTareasUsuario(datos.tareas || {});
    } catch (error) {
        console.error("Error al cargar usuario:", error);
        mostrarMensajeUsuario("No se pudo conectar con el servidor.", "danger");
        userElements.estadoTabla.textContent = "Error";
        userElements.lista.innerHTML = '<div class="task-list-empty">No se pudieron cargar las tareas.</div>';
    }
}

document.querySelector("#refresh_user_tasks").addEventListener("click", cargarPanelUsuario);
document.querySelector("#logout_user_button").addEventListener("click", cerrarSesion);

document.addEventListener("DOMContentLoaded", cargarPanelUsuario);
