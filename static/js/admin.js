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
    fechaLimite: document.querySelector("#fecha_limite"),
    prioridad: document.querySelector("#prioridad"),
    tareaActualId: null,
    nuevo: document.querySelector("#nuevo"),
    nuevaDescripcion: document.querySelector("#nueva_descripcion"),
    nuevaFecha: document.querySelector("#nueva_fecha")
};

let resolverEliminacionPendiente = null;

function redirigirInicio() {
    window.location.href = "/";
}

function cerrarSesion() {
    localStorage.removeItem("access_token");
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

function abrirModalEliminacion(nombreTarea) {
    elementos.deleteTaskName.textContent = nombreTarea;
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
    const urgentes = items.filter(item => item.prioridad === "urgente").length;
    const importantes = items.filter(item => item.prioridad === "importante").length;
    const deseables = items.filter(item => item.prioridad === "deseable").length;

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
    elementos.fechaLimite.value = "";
    elementos.prioridad.value = "";
    elementos.tareaActualId = null;
    elementos.nuevo.value = "";
    elementos.nuevaDescripcion.value = "";
    elementos.nuevaFecha.value = "";
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function completarFormularioEdicion(id, tarea, descripcion, fecha) {
    elementos.tareaActualId = id;
    elementos.nuevaDescripcion.value = descripcion || "";
    elementos.nuevaFecha.value = fecha || "";
    elementos.nuevo.focus();
    mostrarMensaje(`Lista para editar: ${tarea}`, "success");
}

async function eliminarTarea(id, nombreTarea) {
    const confirmada = await abrirModalEliminacion(nombreTarea);
    if (!confirmada) return;

    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "DELETE",
            headers: obtenerHeaders(),
            body: JSON.stringify({ id })
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
                <th>Fecha limite</th>
                <th>Prioridad</th>
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
        const fecha = tarea.fecha_limite || "";
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

        const celdaFecha = document.createElement("td");
        celdaFecha.dataset.label = "Fecha limite";
        celdaFecha.textContent = formatearFecha(fecha);

        const celdaPrioridad = document.createElement("td");
        celdaPrioridad.dataset.label = "Prioridad";
        const badge = document.createElement("span");
        badge.className = `priority-label priority-${prioridadClase}`;
        badge.textContent = prioridad;
        celdaPrioridad.appendChild(badge);

        const celdaAcciones = document.createElement("td");
        celdaAcciones.dataset.label = "Acciones";
        const acciones = document.createElement("div");
        acciones.className = "table-actions";

        const botonEditar = document.createElement("button");
        botonEditar.className = "table-btn edit";
        botonEditar.type = "button";
        botonEditar.dataset.action = "edit";
        botonEditar.dataset.id = id;
        botonEditar.dataset.task = nombreTarea;
        botonEditar.dataset.descripcion = descripcion;
        botonEditar.dataset.fecha = fecha;
        botonEditar.textContent = "Editar";

        const botonEliminar = document.createElement("button");
        botonEliminar.className = "table-btn delete";
        botonEliminar.type = "button";
        botonEliminar.dataset.action = "delete";
        botonEliminar.dataset.id = id;
        botonEliminar.dataset.task = nombreTarea;
        botonEliminar.textContent = "Eliminar";

        acciones.append(botonEditar, botonEliminar);
        celdaAcciones.appendChild(acciones);

        fila.append(celdaId, celdaTarea, celdaDescripcion, celdaFecha, celdaPrioridad, celdaAcciones);
        tbody.appendChild(fila);
    });

    elementos.lista.appendChild(table);
    actualizarMetricas(datos);
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
    const fecha_limite = elementos.fechaLimite.value;
    const prioridad = elementos.prioridad.value;

    if (!tarea || !prioridad) {
        mostrarToast("Completa la tarea y la prioridad.", "danger", "Alta de tarea");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "POST",
            headers: obtenerHeaders(),
            body: JSON.stringify({ tarea, prioridad, descripcion, fecha_limite })
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
    const id = elementos.tareaActualId;
    const nuevo = elementos.nuevo.value.trim();
    const nueva_descripcion = elementos.nuevaDescripcion.value.trim();
    const nueva_fecha = elementos.nuevaFecha.value;

    if (!id || !nuevo) {
        mostrarMensaje("Seleccioná una tarea para editar y completá el nuevo nombre.", "danger");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE}/crud`, {
            method: "PATCH",
            headers: obtenerHeaders(),
            body: JSON.stringify({ id, nuevo, nueva_descripcion, nueva_fecha })
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

elementos.lista.addEventListener("click", async evento => {
    const boton = evento.target.closest("button[data-action]");
    if (!boton) return;

    const id = boton.dataset.id;
    const nombreTarea = boton.dataset.task;

    if (boton.dataset.action === "edit") {
        completarFormularioEdicion(id, nombreTarea, boton.dataset.descripcion, boton.dataset.fecha);
        return;
    }

    if (boton.dataset.action === "delete") {
        await eliminarTarea(id, nombreTarea);
    }
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

document.addEventListener("DOMContentLoaded", cargarTareas);