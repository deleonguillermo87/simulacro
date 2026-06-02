// src/js/auth.js
const SESSION_KEY = "riwi_session";

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return getSession() !== null;
}