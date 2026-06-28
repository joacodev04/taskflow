function DashboardHeader({ onRefresh, onLogout }) {
  return (
    <header className="dashboard-header">
      <div className="section-head">
        <h1>Gestion de tareas.</h1>
      </div>
      <div className="toolbar">
        <button className="btn btn-secondary" type="button" onClick={onRefresh}>
          Actualizar
        </button>
        <button className="btn btn-primary" type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
