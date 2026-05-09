const API_BASE = window.location.origin;
const loginForm = document.querySelector("#formulario_login");
const submitButton = document.querySelector("#submit_login");
const errorBox = document.querySelector("#error_login");

function mostrarError(mensaje) {
    errorBox.textContent = mensaje;
    errorBox.className = "alert alert-danger";
    errorBox.classList.remove("d-none");
}

function ocultarError() {
    errorBox.textContent = "";
    errorBox.className = "alert alert-danger d-none";
}

function bloquearFormulario(estado) {
    submitButton.disabled = estado;
    submitButton.textContent = estado ? "Ingresando..." : "Continuar";
}

loginForm.addEventListener("submit", async evento => {
    evento.preventDefault();
    ocultarError();

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value;

    if (!username || !password) {
        mostrarError("Completá usuario y contraseña.");
        return;
    }

    bloquearFormulario(true);

    try {
        const respuesta = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.access_token) {
            mostrarError(datos.message || "No se pudo iniciar sesión.");
            return;
        }

        localStorage.setItem("access_token", datos.access_token);
        localStorage.setItem("user_role", datos.role || "");
        window.location.href = "/admin.html";
    } catch (error) {
        console.error("Error de login:", error);
        mostrarError("No se pudo conectar con el servidor.");
    } finally {
        bloquearFormulario(false);
    }
});
