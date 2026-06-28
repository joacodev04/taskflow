import { useEffect, useRef, useState } from "react";
import { ApiError } from "../services/apiClient";
import { createTask, deleteTask, fetchTasks, updateTask } from "../services/taskService";

function buildMetrics(tasks) {
  const urgent = tasks.filter(task => task.prioridad === "urgente").length;
  const important = tasks.filter(task => task.prioridad === "importante").length;
  const deseable = tasks.filter(task => task.prioridad === "deseable").length;

  return {
    total: tasks.length,
    urgent,
    important,
    deseable,
    updated:
      tasks.length > 0
        ? new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : "-"
  };
}

export default function useTaskDashboard(token, onSessionExpired) {
  const [tasks, setTasks] = useState([]);
  const [tableStatus, setTableStatus] = useState("Esperando carga");
  const [message, setMessage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createForm, setCreateForm] = useState({
    tarea: "",
    descripcion: "",
    prioridad: "",
    fecha_limite: ""
  });
  const [editForm, setEditForm] = useState({
    id: null,
    tareaActual: "",
    nuevo: "",
    nueva_descripcion: "",
    nueva_fecha: ""
  });

  const timeoutIdsRef = useRef([]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage(null);
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    void loadTasks();

    return undefined;
  }, [token]);

  useEffect(() => {
    if (!deleteTarget) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDeleteTarget(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteTarget]);

  const metrics = buildMetrics(tasks);

  function scheduleTimeout(callback, delay) {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutIdsRef.current.push(timeoutId);
  }

  function handleApiError(error, fallbackMessage) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 422)) {
      pushToast("Tu sesion vencio. Vuelve a ingresar.", "danger", "Sesion");
      onSessionExpired();
      return true;
    }

    const text = error instanceof Error ? error.message : fallbackMessage;
    return text;
  }

  function pushToast(text, type = "success", title = "Notificacion") {
    const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts(current => [...current, { id, text, type, title, visible: false, hiding: false }]);

    scheduleTimeout(() => {
      setToasts(current => current.map(toast => (toast.id === id ? { ...toast, visible: true } : toast)));
    }, 0);

    scheduleTimeout(() => {
      setToasts(current =>
        current.map(toast =>
          toast.id === id ? { ...toast, visible: false, hiding: true } : toast
        )
      );
    }, 3200);

    scheduleTimeout(() => {
      setToasts(current => current.filter(toast => toast.id !== id));
    }, 3440);
  }

  function showMessage(text, type = "danger") {
    setMessage({ text, type });
  }

  function resetCreateForm() {
    setCreateForm({
      tarea: "",
      descripcion: "",
      prioridad: "",
      fecha_limite: ""
    });
  }

  function resetEditForm() {
    setEditForm({
      id: null,
      tareaActual: "",
      nuevo: "",
      nueva_descripcion: "",
      nueva_fecha: ""
    });
  }

  async function loadTasks() {
    setTableStatus("Cargando...");

    try {
      const data = await fetchTasks(token);
      setTasks(data);
      setTableStatus(data.length ? `${data.length} tareas cargadas` : "Sin tareas");
    } catch (error) {
      const handled = handleApiError(error, "No se pudieron cargar las tareas.");
      if (handled === true) {
        return;
      }

      setTasks([]);
      setTableStatus("Error");
      showMessage(handled);
    }
  }

  async function submitCreateTask() {
    if (!createForm.tarea.trim() || !createForm.prioridad) {
      pushToast("Completa la tarea y la prioridad.", "danger", "Alta de tarea");
      return;
    }

    try {
      const data = await createTask(token, createForm);
      pushToast(data.message, "success", "Alta de tarea");
      resetCreateForm();
      await loadTasks();
    } catch (error) {
      const handled = handleApiError(error, "Error al agregar la tarea.");
      if (handled !== true) {
        pushToast(handled, "danger", "Alta de tarea");
      }
    }
  }

  async function submitUpdateTask() {
    if (!editForm.id || !editForm.nuevo.trim()) {
      showMessage("Selecciona una tarea para editar y completa el nuevo nombre.");
      return;
    }

    try {
      const data = await updateTask(token, {
        id: editForm.id,
        nuevo: editForm.nuevo,
        nueva_descripcion: editForm.nueva_descripcion,
        nueva_fecha: editForm.nueva_fecha
      });
      showMessage(data.message, "success");
      resetEditForm();
      await loadTasks();
    } catch (error) {
      const handled = handleApiError(error, "Error al modificar la tarea.");
      if (handled !== true) {
        showMessage(handled);
      }
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTarget) {
      return;
    }

    try {
      const data = await deleteTask(token, deleteTarget.id);
      pushToast(data.message, "success", "Eliminacion");
      setDeleteTarget(null);
      resetEditForm();
      await loadTasks();
    } catch (error) {
      const handled = handleApiError(error, "Error al eliminar la tarea.");
      if (handled !== true) {
        pushToast(handled, "danger", "Eliminacion");
      }
    }
  }

  function selectTask(task) {
    setEditForm({
      id: task.id,
      tareaActual: task.tarea,
      nuevo: task.tarea,
      nueva_descripcion: task.descripcion,
      nueva_fecha: task.fecha_limite
    });
    showMessage(`Lista para editar: ${task.tarea}`, "success");
  }

  function requestDelete(task) {
    setDeleteTarget(task);
  }

  function updateCreateField(field, value) {
    setCreateForm(current => ({ ...current, [field]: value }));
  }

  function updateEditField(field, value) {
    setEditForm(current => ({ ...current, [field]: value }));
  }

  return {
    tasks,
    tableStatus,
    metrics,
    message,
    toasts,
    deleteTarget,
    createForm,
    editForm,
    loadTasks,
    updateCreateField,
    updateEditField,
    submitCreateTask,
    submitUpdateTask,
    confirmDeleteTask,
    selectTask,
    requestDelete,
    cancelDelete: () => setDeleteTarget(null)
  };
}
