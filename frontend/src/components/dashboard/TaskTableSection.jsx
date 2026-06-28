function formatPriorityLabel(priority) {
  if (!priority) {
    return "No especificada";
  }

  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

function TaskTableSection({ tasks, tableStatus, onEdit, onDelete }) {
  return (
    <section className="card">
      <div className="welcome-block">
        <div className="welcome-title">
          <span className="eyebrow">Tareas actuales</span>
          <h2>Vista general del tablero</h2>
        </div>
        <span className="pill">{tableStatus}</span>
      </div>

      <div className="table-shell">
        {tasks.length ? (
          <table className="task-table">
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
            <tbody>
              {tasks.map(task => {
                const priorityLabel = formatPriorityLabel(task.prioridad);

                return (
                  <tr key={task.id}>
                    <td data-label="ID">{task.id}</td>
                    <td data-label="Tarea">
                      <div className="task-title">{task.tarea}</div>
                    </td>
                    <td data-label="Descripcion">
                      <div className="task-meta">{task.descripcion || "-"}</div>
                    </td>
                    <td data-label="Fecha limite">{formatDateLabel(task.fecha_limite)}</td>
                    <td data-label="Prioridad">
                      <span className={`priority-label priority-${priorityLabel.replace(/\s+/g, "-")}`}>
                        {priorityLabel}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="table-actions">
                        <button className="table-btn edit" type="button" onClick={() => onEdit(task)}>
                          Editar
                        </button>
                        <button className="table-btn delete" type="button" onClick={() => onDelete(task)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="task-list-empty">
            {tableStatus === "Cargando..." ? "Actualizando tareas..." : "No hay tareas registradas."}
          </div>
        )}
      </div>
    </section>
  );
}

export default TaskTableSection;
