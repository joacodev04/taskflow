const API_BASE = window.location.origin;

const elementos = {
    form: document.querySelector("#auth_form"),
    title: document.querySelector("#auth_title"),
    description: document.querySelector("#auth_description"),
    note: document.querySelector("#auth_note"),
    username: document.querySelector("#username"),
    password: document.querySelector("#password"),
    confirmPassword: document.querySelector("#confirm_password"),
    confirmGroup: document.querySelector("#confirm_password_group"),
    submitButton: document.querySelector("#submit_auth"),
    feedback: document.querySelector("#auth_feedback"),
    modeButtons: Array.from(document.querySelectorAll("[data-mode]"))
};

const modos = {
    login: {
        title: "Iniciar sesion",
        description: "Entra con tu usuario para abrir el panel principal.",
        note: "Usa usuario1 / 123 o crea una cuenta nueva sin salir de esta pantalla.",
        submitLabel: "Continuar",
        pendingLabel: "Ingresando..."
    },
    register: {
        title: "Crear cuenta",
        description: "Registra un usuario nuevo y entra directo al panel principal.",
        note: "Tu cuenta se crea en MySQL y queda lista para ver sus tareas desde Workbench.",
        submitLabel: "Crear cuenta",
        pendingLabel: "Creando cuenta..."
    }
};

let modoActual = "login";

function mostrarFeedback(mensaje, tipo = "danger") {
    elementos.feedback.textContent = mensaje;
    elementos.feedback.className = `alert alert-${tipo} mb-0`;
    elementos.feedback.classList.remove("d-none");
}

function ocultarFeedback() {
    elementos.feedback.textContent = "";
    elementos.feedback.className = "alert d-none mb-0";
}

function limpiarPasswords() {
    elementos.password.value = "";
    elementos.confirmPassword.value = "";
}

function bloquearFormulario(estado) {
    elementos.submitButton.disabled = estado;
    elementos.submitButton.textContent = estado
        ? modos[modoActual].pendingLabel
        : modos[modoActual].submitLabel;

    elementos.modeButtons.forEach(button => {
        button.disabled = estado;
    });
}

function actualizarModo(modo) {
    modoActual = modo;
    const config = modos[modo];
    const mostrarConfirmacion = modo === "register";

    elementos.title.textContent = config.title;
    elementos.description.textContent = config.description;
    elementos.note.innerHTML = config.note;
    elementos.submitButton.textContent = config.submitLabel;
    elementos.password.autocomplete = mostrarConfirmacion ? "new-password" : "current-password";
    elementos.confirmGroup.classList.toggle("hidden", !mostrarConfirmacion);
    elementos.confirmGroup.setAttribute("aria-hidden", String(!mostrarConfirmacion));
    elementos.confirmPassword.required = mostrarConfirmacion;

    elementos.modeButtons.forEach(button => {
        const activo = button.dataset.mode === modo;
        button.classList.toggle("is-active", activo);
        button.setAttribute("aria-selected", String(activo));
    });

    ocultarFeedback();
    limpiarPasswords();
}

async function enviarJson(path, payload) {
    const respuesta = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    let datos = {};
    try {
        datos = await respuesta.json();
    } catch (error) {
        console.error("Respuesta no JSON:", error);
    }

    if (!respuesta.ok) {
        throw new Error(datos.message || "No se pudo completar la solicitud.");
    }

    return datos;
}

async function iniciarSesion(username, password) {
    const datos = await enviarJson("/login", { username, password });

    if (!datos.access_token) {
        throw new Error("No se recibio el token de acceso.");
    }

    localStorage.setItem("access_token", datos.access_token);
}

async function registrarUsuario(username, password) {
    await enviarJson("/registro", { username, password });
}

function validarFormulario(username, password, confirmPassword) {
    if (!username || !password) {
        return "Completa usuario y contrasena.";
    }

    if (modoActual === "register" && password !== confirmPassword) {
        return "Las contrasenas no coinciden.";
    }

    return "";
}

elementos.modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (button.dataset.mode !== modoActual) {
            actualizarModo(button.dataset.mode);
        }
    });
});

elementos.form.addEventListener("submit", async evento => {
    evento.preventDefault();
    ocultarFeedback();

    const username = elementos.username.value.trim();
    const password = elementos.password.value;
    const confirmPassword = elementos.confirmPassword.value;
    const mensajeError = validarFormulario(username, password, confirmPassword);

    if (mensajeError) {
        mostrarFeedback(mensajeError);
        return;
    }

    bloquearFormulario(true);

    try {
        if (modoActual === "register") {
            await registrarUsuario(username, password);
            mostrarFeedback("Cuenta creada. Iniciando sesion...", "success");
        }

        await iniciarSesion(username, password);
        window.location.href = "/admin.html";
    } catch (error) {
        console.error("Error de autenticacion:", error);
        mostrarFeedback(error.message || "No se pudo conectar con el servidor.");
    } finally {
        bloquearFormulario(false);
    }
});

actualizarModo("login");
