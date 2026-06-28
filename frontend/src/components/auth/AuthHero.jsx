function AuthHero() {
  return (
    <section className="col-lg-8">
      <div className="hero-panel h-100">
        <div className="hero-copy">
          <span className="eyebrow">Taskflow Control</span>
          <h1>Ordena tu trabajo con una interfaz clara y actual.</h1>
          <p>
            Accede al panel para crear, priorizar y revisar tareas sin una UI rota ni pantallas
            inconsistentes.
          </p>
          <div className="hero-actions">
            <span className="pill">Flujo mas simple</span>
            <span className="pill">Diseno responsive</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="metric">
            <span>Vista</span>
            <strong>Mas limpia</strong>
          </div>
          <div className="metric">
            <span>Acciones</span>
            <strong>Mas rapidas</strong>
          </div>
          <div className="metric">
            <span>Control</span>
            <strong>Mas simple</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthHero;
