import FormField from "../common/FormField";

function TaskEditCard({ form, onFieldChange, onSubmit, onDeleteRequest }) {
  return (
    <div className="col-lg-5">
      <div className="stack">
        <article className="card">
          <span className="eyebrow">Edicion rapida</span>
          <h3>Modificar o eliminar</h3>
          <div className="form-grid">
            <FormField label="Tarea actual" htmlFor="tarea_actual">
              <input
                id="tarea_actual"
                className="form-control"
                type="text"
                placeholder="Selecciona desde la tabla"
                value={form.tareaActual}
                readOnly
              />
            </FormField>

            <FormField label="Nueva descripcion" htmlFor="nueva_descripcion">
              <input
                id="nueva_descripcion"
                className="form-control"
                type="text"
                placeholder="Define la nueva descripcion"
                value={form.nueva_descripcion}
                onChange={event => onFieldChange("nueva_descripcion", event.target.value)}
              />
            </FormField>

            <FormField label="Nuevo nombre" htmlFor="nuevo">
              <input
                id="nuevo"
                className="form-control"
                type="text"
                placeholder="Define el nuevo nombre"
                value={form.nuevo}
                onChange={event => onFieldChange("nuevo", event.target.value)}
              />
            </FormField>

            <FormField label="Nueva fecha limite" htmlFor="nueva_fecha">
              <input
                id="nueva_fecha"
                className="form-control"
                type="date"
                value={form.nueva_fecha}
                onChange={event => onFieldChange("nueva_fecha", event.target.value)}
              />
            </FormField>

            <div className="inline-actions d-grid d-md-flex">
              <button className="btn btn-success flex-md-fill" type="button" onClick={onSubmit}>
                Modificar
              </button>
              <button
                className="btn btn-danger flex-md-fill"
                type="button"
                onClick={onDeleteRequest}
                disabled={!form.id}
              >
                Eliminar
              </button>
            </div>
          </div>
        </article>

        <article className="subtle-card">
          <p className="footer-text">
            Tip: puedes cargar una tarea desde la tabla con Editar y luego cambiarle el nombre desde
            este panel.
          </p>
        </article>
      </div>
    </div>
  );
}

export default TaskEditCard;
