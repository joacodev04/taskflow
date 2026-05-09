const API_BASE = window.location.origin;
const token = localStorage.getItem("access_token");
 
const elementos = {
    mensaje: document.querySelector("#mensaje"),
    toastContainer: document.querySelector("#toast_container"),
    deleteModal: document.querySelector("#delete_modal"),
    deleteTaskName: document.querySelector("#delete_task_name"),
    cancelDelete: document.querySelector("#cancel_delete"),
    confirmDelete: document.querySelector("#confirm_delete"),
    lista: document.querySelector("#admin_task_list"),
    estadoTabla: document.querySelector("#table_status"),
    total: document.querySelector("#metric_total"),
    urgent: document.querySelector("#metric_urgent"),
    important: document.querySelector("#metric_important"),
    deseable: document.querySelector("#metric_deseable"),
    updated: document.querySelector("#metric_updated"),
    tarea: document.querySelector("#tarea"),
    descripcion: document.querySelector("#descripcion"),
    prioridad: document.querySelector("#prioridad"),
    tareaActual: document.querySelector("#tarea_actual"),
    nuevo: document.querySelector("#nuevo"),
    nuevaDescripcion: document.querySelector("#nueva_descripcion")
};
 
let resolverEliminacionPendiente = null;
 
function redirigirInicio() {
    window.location.href = "/";
}
 
function cerrarSesion() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    redirigirInicio();
}
 
function mostrarMensaje(mensaje, tipo = "danger") {
    elementos.mensaje.textContent = mensaje;
    elementos.mensaje.className = `message-box alert-${tipo}`;
    setTimeout(() => {
        elementos.mensaje.textContent = "";
        elementos.mensaje.className = "message-box";
    }, 3600);
}
 
function mostrarToast(mensaje, tipo = "success", titulo = "Notificacion") {
    const toast = document.createElement("article");
    toast.className = `toast-notification toast-${tipo}`;
 
    const encabezado = document.createElement("div");
    encabezado.className = "toast-title";
    encabezado.textContent = titulo;
 
    const contenido = document.createElement("div");
    contenido.className = "toast-text";
    contenido.textContent = mensaje;
 
    toast.append(encabezado, contenido);
    elementos.toastContainer.appendChild(toast);
 
    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });
 
    window.setTimeout(() => {
        toast.classList.remove("is-visible");
        toast.classList.add("is-hiding");
        window.setTimeout(() => toast.remove(), 220);
    }, 3200);
}
 
function abrirModalEliminacion(tarea) {
    elementos.deleteTaskName.textContent = tarea;
    elementos.deleteModal.hidden = false;
    elementos.deleteModal.setAttribute("aria-hidden", "false");
 
    return new Promise(resolve => {
        resolverEliminacionPendiente = resolve;
        requestAnimationFrame(() => {
            elementos.deleteModal.classList.add("is-visible");
            elementos.confirmDelete.focus();
        });
    });
}
 
function cerrarModalEliminacion(confirmado) {
    if (resolverEliminacionPendiente) {
        resolverEliminacionPendiente(confirmado);
        resolverEliminacionPendiente = null;
    }
 
    elementos.deleteModal.classList.remove("is-visible");
    elementos.deleteModal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
        elementos.deleteModal.hidden = true;
    }, 200);
}
 
function obtenerHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}
 
function actualizarMetricas(datos) {
    const items = Object.values(datos || {});
    const urgentes = items.filter(item => item.prioridad === "Urgente").length;
    const importantes = items.filter(item => item.prioridad === "Importante").length;
    const deseables = items.filter(item => item.prioridad === "Deseable").length;
 
    elementos.total.textContent = String(items.length);
    elementos.urgent.textContent = String(urgentes);
    elementos.important.textContent = String(importantes);
    elementos.deseable.textContent = String(deseables);
    elementos.updated.textContent = new Date().toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
    });
    elementos.estadoTabla.textContent = items.length ? `${items.length} tareas cargadas` : "Sin tareas";
}
 
function limpiarFormularios() {
    elementos.tarea.value = "";
    elementos.descripcion.value = "";
    elementos.prioridad.value = "";
    elementos.tareaActual.value = "";
    elementos.nuevo.value = "";
    elementos.nuevaDescripcion.value = "";
}
 
function completarFormularioEdicion(tarea, descripcion) {
    elementos.tareaActual.value = tarea;
    elementos.nuevaDescripcion.value = descripcion || "";
    elementos.nuevo.focus();
    mostrarMensaje(`Lista para editar: ${tarea}`, "success");
}
 
async function eliminarTarea(tarea) {
    const confirmada = await abrirModalEliminacion(tarea);
    if (!confirmada) {
        return;
    }
 
    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "DELETE",
            headers: obtenerHeaders(),
            body: JSON.stringify({ tarea })
        });
        const datos = await respuesta.json();
 
        mostrarToast(datos.message, respuesta.ok ? "success" : "danger", "Eliminacion");
        if (respuesta.ok) {
            limpiarFormularios();
            await cargarTareas();
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarToast("Error al eliminar la tarea.", "danger", "Eliminacion");
    }
}
 
function renderizarTabla(datos) {
    const items = Object.entries(datos || {});
    elementos.lista.innerHTML = "";
 
    if (!items.length) {
        elementos.lista.innerHTML = '<div class="task-list-empty">No hay tareas registradas.</div>';
        actualizarMetricas({});
        return;
    }
 
    const table = document.createElement("table");
    table.className = "task-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Tarea</th>
                <th>Descripcion</th>
                <th>Prioridad</th>
                <th>Creador</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
 
    const tbody = table.querySelector("tbody");
 
    items.forEach(([id, tarea]) => {
        const prioridad = tarea.prioridad || "No especificada";
        const prioridadClase = prioridad.replace(/\s+/g, "-");
        const nombreTarea = tarea.tarea || "Sin nombre";
        const descripcion = tarea.descripcion || "-";
        const creador = tarea.creador || "Desconocido";
        const fila = document.createElement("tr");
 
        const celdaId = document.createElement("td");
        celdaId.dataset.label = "ID";
        celdaId.textContent = id;
 
        const celdaTarea = document.createElement("td");
        celdaTarea.dataset.label = "Tarea";
        const titulo = document.createElement("div");
        titulo.className = "task-title";
        titulo.textContent = nombreTarea;
        celdaTarea.appendChild(titulo);
 
        const celdaDescripcion = document.createElement("td");
        celdaDescripcion.dataset.label = "Descripcion";
        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.textContent = descripcion;
        celdaDescripcion.appendChild(meta);
 
        const celdaPrioridad = document.createElement("td");
        celdaPrioridad.dataset.label = "Prioridad";
        const badge = document.createElement("span");
        badge.className = `priority-label priority-${prioridadClase}`;
        badge.textContent = prioridad;
        celdaPrioridad.appendChild(badge);
 
        const celdaCreador = document.createElement("td");
        celdaCreador.dataset.label = "Creador";
        celdaCreador.textContent = creador;
 
        const celdaAcciones = document.createElement("td");
        celdaAcciones.dataset.label = "Acciones";
        const acciones = document.createElement("div");
        acciones.className = "table-actions";
 
        const botonEditar = document.createElement("button");
        botonEditar.className = "table-btn edit";
        botonEditar.type = "button";
        botonEditar.dataset.action = "edit";
        botonEditar.dataset.task = nombreTarea;
        botonEditar.dataset.descripcion = descripcion;
        botonEditar.textContent = "Editar";
 
        const botonEliminar = document.createElement("button");
        botonEliminar.className = "table-btn delete";
        botonEliminar.type = "button";
        botonEliminar.dataset.action = "delete";
        botonEliminar.dataset.task = nombreTarea;
        botonEliminar.textContent = "Eliminar";
 
        acciones.append(botonEditar, botonEliminar);
        celdaAcciones.appendChild(acciones);
 
        fila.append(celdaId, celdaTarea, celdaDescripcion, celdaPrioridad, celdaCreador, celdaAcciones);
        tbody.appendChild(fila);
    });
 
    elementos.lista.appendChild(table);
    actualizarMetricas(datos);
}
 
async function cargarContenido() {
    if (!token) {
        redirigirInicio();
        return;
    }
 
    try {
        const respuesta = await fetch(`${API_BASE}/admin`, {
            method: "GET",
            headers: obtenerHeaders()
        });
 
        if (respuesta.status === 401) {
            cerrarSesion();
            return;
        }
 
        if (respuesta.status === 403) {
            mostrarMensaje("Acceso denegado. Esta pagina es solo para administradores.", "danger");
            setTimeout(redirigirInicio, 1800);
            return;
        }
 
        await cargarTareas();
    } catch (error) {
        console.error("Error al validar permisos:", error);
        mostrarMensaje("Error al verificar permisos.", "danger");
    }
}
 
async function cargarTareas() {
    if (!token) {
        redirigirInicio();
        return;
    }
 
    elementos.estadoTabla.textContent = "Cargando...";
    elementos.lista.innerHTML = '<div class="task-list-empty">Actualizando tareas...</div>';
 
    try {
        const respuesta = await fetch(`${API_BASE}/cargarobjeto`, {
            method: "GET",
            headers: obtenerHeaders()
        });
        const datos = await respuesta.json();
 
        if (!respuesta.ok) {
            elementos.lista.innerHTML = '<div class="task-list-empty">No se pudieron cargar las tareas.</div>';
            elementos.estadoTabla.textContent = "Error";
            return;
        }
 
        renderizarTabla(datos);
    } catch (error) {
        console.error("Error al cargar tareas:", error);
        elementos.lista.innerHTML = '<div class="task-list-empty">No se pudieron cargar las tareas.</div>';
        elementos.estadoTabla.textContent = "Error";
    }
}
 
document.querySelector("#agregar").addEventListener("click", async () => {
    const tarea = elementos.tarea.value.trim();
    const descripcion = elementos.descripcion.value.trim();
    const prioridad = elementos.prioridad.value;
 
    if (!tarea || !prioridad) {
        mostrarToast("Completa la tarea y la prioridad.", "danger", "Alta de tarea");
        return;
    }
 
    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "POST",
            headers: obtenerHeaders(),
            body: JSON.stringify({ tarea, prioridad, descripcion })
        });
        const datos = await respuesta.json();
 
        mostrarToast(datos.message, respuesta.ok ? "success" : "danger", "Alta de tarea");
        if (respuesta.ok) {
            limpiarFormularios();
            await cargarTareas();
        }
    } catch (error) {
        console.error("Error al agregar:", error);
        mostrarToast("Error al agregar la tarea.", "danger", "Alta de tarea");
    }
});
 
document.querySelector("#modificar").addEventListener("click", async () => {
    const tarea = elementos.tareaActual.value.trim();
    const nuevo = elementos.nuevo.value.trim();
    const nueva_descripcion = elementos.nuevaDescripcion.value.trim();
 
    if (!tarea || !nuevo) {
        mostrarMensaje("Completa la tarea actual y el nuevo nombre.", "danger");
        return;
    }
 
    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "PATCH",
            headers: obtenerHeaders(),
            body: JSON.stringify({ tarea, nuevo, nueva_descripcion })
        });
        const datos = await respuesta.json();
 
        mostrarMensaje(datos.message, respuesta.ok ? "success" : "danger");
        if (respuesta.ok) {
            limpiarFormularios();
            await cargarTareas();
        }
    } catch (error) {
        console.error("Error al modificar:", error);
        mostrarMensaje("Error al modificar la tarea.", "danger");
    }
});
 
document.querySelector("#eliminar").addEventListener("click", async () => {
    const tarea = elementos.tareaActual.value.trim();
 
    if (!tarea) {
        mostrarMensaje("Ingresa la tarea que quieres eliminar.", "danger");
        return;
    }
 
    await eliminarTarea(tarea);
});
 
document.querySelector("#refresh_tasks").addEventListener("click", cargarTareas);
document.querySelector("#logout_button").addEventListener("click", cerrarSesion);
elementos.cancelDelete.addEventListener("click", () => cerrarModalEliminacion(false));
elementos.confirmDelete.addEventListener("click", () => cerrarModalEliminacion(true));
 
elementos.deleteModal.addEventListener("click", evento => {
    if (evento.target === elementos.deleteModal) {
        cerrarModalEliminacion(false);
    }
});
 
document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && !elementos.deleteModal.hidden) {
        cerrarModalEliminacion(false);
    }
});
 
elementos.lista.addEventListener("click", async evento => {
    const boton = evento.target.closest("button[data-action]");
    if (!boton) {
        return;
    }
 
    const tarea = boton.dataset.task;
    if (!tarea) {
        mostrarMensaje("No se pudo identificar la tarea seleccionada.", "danger");
        return;
    }
 
    if (boton.dataset.action === "edit") {
        completarFormularioEdicion(tarea, boton.dataset.descripcion);
        return;
    }
 
    if (boton.dataset.action === "delete") {
        await eliminarTarea(tarea);
    }
});
 
document.addEventListener("DOMContentLoaded", cargarContenido);