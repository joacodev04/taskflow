const API_BASE = window.location.origin;

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

export async function requestJson(path, { method = "GET", token = "", body = null } = {}) {
  const headers = {};

  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE + path, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body)
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(data.message || "No se pudo completar la solicitud.", response.status, data);
  }

  return data;
}
