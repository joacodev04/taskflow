import FormField from "../common/FormField";

function TaskCreateCard({ form, onFieldChange, onSubmit }) {
  return (
    <div className="col-lg-7">
      <article className="card h-100">
        <span className="eyebrow">Nueva tarea</span>
        <h3>Agregar al tablero</h3>
        <div className="form-grid">
          <FormField label="Tarea" htmlFor="tarea">
            <input
              id="tarea"
              className="form-control"
              type="text"
              placeholder="Ej. Programacion"
              value={form.tarea}
              onChange={event => onFieldChange("tarea", event.target.value)}
            />
          </FormField>

          <FormField label="Descripcion" htmlFor="descripcion">
            <input
              id="descripcion"
              className="form-control"
              type="text"
              placeholder="Ej. Estudiar"
              value={form.descripcion}
              onChange={event => onFieldChange("descripcion", event.target.value)}
            />
          </FormField>

          <FormField label="Prioridad" htmlFor="prioridad">
            <select
              id="prioridad"
              className="form-select"
              value={form.prioridad}
              onChange={event => onFieldChange("prioridad", event.target.value)}
            >
              <option value="">Selecciona una prioridad</option>
              <option value="Urgente">Urgente</option>
              <option value="Importante">Importante</option>
              <option value="Deseable">Deseable</option>
            </select>
          </FormField>

          <FormField label="Fecha limite" htmlFor="fecha_limite">
            <input
              id="fecha_limite"
              className="form-control"
              type="date"
              value={form.fecha_limite}
              onChange={event => onFieldChange("fecha_limite", event.target.value)}
            />
          </FormField>

          <button className="btn btn-primary w-100" type="button" onClick={onSubmit}>
            Guardar tarea
          </button>
        </div>
      </article>
    </div>
  );
}

export default TaskCreateCard;
