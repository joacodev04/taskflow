import { requestJson } from "./apiClient";

function normalizeTaskCollection(collection) {
  return Object.entries(collection || {}).map(([id, task]) => ({
    id: Number(id),
    tarea: task.tarea || "Sin nombre",
    descripcion: task.descripcion || "",
    prioridad: task.prioridad || "",
    fecha_limite: task.fecha_limite || ""
  }));
}

export async function fetchTasks(token) {
  const data = await requestJson("/cargarobjeto", { token });
  return normalizeTaskCollection(data);
}

export function createTask(token, payload) {
  return requestJson("/crud", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateTask(token, payload) {
  return requestJson("/crud", {
    method: "PATCH",
    token,
    body: payload
  });
}

export function deleteTask(token, taskId) {
  return requestJson("/crud", {
    method: "DELETE",
    token,
    body: { id: taskId }
  });
}
