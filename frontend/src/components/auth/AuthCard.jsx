import AlertMessage from "../common/AlertMessage";
import FormField from "../common/FormField";

function AuthCard({
  mode,
  username,
  password,
  confirmPassword,
  feedback,
  isSubmitting,
  onModeChange,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}) {
  const config = {
    login: {
      title: "Iniciar sesion",
      description: "Entra con tu usuario para abrir el panel principal.",
      note: (
        <>
          Usa <strong>usuario1 / 123</strong> o crea una cuenta nueva sin salir de esta pantalla.
        </>
      ),
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
  }[mode];

  return (
    <section className="col-lg-4">
      <div className="auth-card h-100">
        <div className="brand-mark">TF</div>

        <div className="auth-switch" role="tablist" aria-label="Tipo de acceso">
          <button
            className={`auth-switch-btn${mode === "login" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            disabled={isSubmitting}
            onClick={() => onModeChange("login")}
          >
            Iniciar sesion
          </button>
          <button
            className={`auth-switch-btn${mode === "register" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            disabled={isSubmitting}
            onClick={() => onModeChange("register")}
          >
            Crear cuenta
          </button>
        </div>

        <h2>{config.title}</h2>
        <p>{config.description}</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <FormField label="Usuario" htmlFor="username">
            <input
              id="username"
              className="form-control"
              type="text"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              value={username}
              onChange={event => onUsernameChange(event.target.value)}
            />
          </FormField>

          <FormField label="Contrasena" htmlFor="password">
            <input
              id="password"
              className="form-control"
              type="password"
              placeholder="Ingresa tu contrasena"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={event => onPasswordChange(event.target.value)}
            />
          </FormField>

          {mode === "register" ? (
            <FormField label="Repetir contrasena" htmlFor="confirm_password">
              <input
                id="confirm_password"
                className="form-control"
                type="password"
                placeholder="Repite tu contrasena"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={event => onConfirmPasswordChange(event.target.value)}
              />
            </FormField>
          ) : null}

          <AlertMessage feedback={feedback} />

          <button className="btn btn-primary btn-block w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? config.pendingLabel : config.submitLabel}
          </button>
        </form>

        <p className="note auth-note">{config.note}</p>
      </div>
    </section>
  );
}

export default AuthCard;
