function DeleteTaskModal({ taskName, isOpen, onCancel, onConfirm }) {
  return (
    <div
      className={`confirm-modal${isOpen ? " is-visible" : ""}`}
      hidden={!isOpen}
      aria-hidden={!isOpen}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="confirm-modal-card" role="dialog" aria-modal="true" aria-labelledby="delete_modal_title">
        <span className="eyebrow">Confirmacion</span>
        <h3 id="delete_modal_title">Eliminar tarea</h3>
        <p className="confirm-modal-text">
          Vas a eliminar <strong>{taskName || "esta tarea"}</strong>. Esta accion no se puede
          deshacer.
        </p>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" type="button" onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTaskModal;
