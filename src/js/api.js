// src/js/api.js
const BASE_URL = "";

// ==================== USUARIOS ====================

export async function loginUser(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/usuarios?email=${email}`);
    if (!res.ok) throw new Error("Error en el servidor");
    const users = await res.json();
    const user = users.find(u => u.password === password);
    return user || null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function getUsuarios() {
  const res = await fetch(`${BASE_URL}/usuarios`);
  return res.json();
}

export async function crearUsuario(data) {
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarUsuario(id, data) {
  const res = await fetch(`${BASE_URL}/usuarios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function eliminarUsuario(id) {
  const res = await fetch(`${BASE_URL}/usuarios/${id}`, { method: "DELETE" });
  return res.ok;
}

// ==================== TAREAS ====================

export async function getTareas() {
  const res = await fetch(`${BASE_URL}/tareas`);
  return res.json();
}

export async function crearTarea(data) {
  const res = await fetch(`${BASE_URL}/tareas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function actualizarTarea(id, data) {
  const res = await fetch(`${BASE_URL}/tareas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function eliminarTarea(id) {
  const res = await fetch(`${BASE_URL}/tareas/${id}`, { method: "DELETE" });
  return res.ok;
}