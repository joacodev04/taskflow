import { requestJson } from "./apiClient";

export function loginUser(username, password) {
  return requestJson("/login", {
    method: "POST",
    body: { username, password }
  });
}

export function registerUser(username, password) {
  return requestJson("/registro", {
    method: "POST",
    body: { username, password }
  });
}
