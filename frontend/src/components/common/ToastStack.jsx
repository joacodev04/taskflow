function ToastStack({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <article
          key={toast.id}
          className={`toast-notification toast-${toast.type}${toast.visible ? " is-visible" : ""}${toast.hiding ? " is-hiding" : ""}`}
        >
          <div className="toast-title">{toast.title}</div>
          <div className="toast-text">{toast.text}</div>
        </article>
      ))}
    </div>
  );
}

export default ToastStack;
