// src/views/dashboard.js — Kanban board
import { getTareas, crearTarea, actualizarTarea, eliminarTarea, getUsuarios } from "../js/api.js";
import { getSession } from "../js/auth.js";
import { mountShell, renderContent, openModal, closeModal, updateSidebarActionBtn, setShellActionHandler, bindSearchInput } from "../js/layout.js";

const COLUMNS = [
  { id: "todo",        label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "review",      label: "In Review" },
  { id: "done",        label: "Done" },
];

let currentUser = null;
let allUsers    = [];
let allTasks    = [];

export async function mostrarDashboard() {
  currentUser = getSession();
  const isAdmin = currentUser?.role === "admin";

  mountShell("/dashboard");

  if (isAdmin) {
    updateSidebarActionBtn({ icon: "add", label: "New Task" });
    setShellActionHandler(() => openTaskModal(null));
  }

  renderContent(`
    <div class="flex items-center justify-center h-full">
      <p class="text-slate-400 text-sm">Loading board…</p>
    </div>
  `);

  try {
    [allTasks, allUsers] = await Promise.all([getTareas(), getUsuarios()]);
  } catch {
    renderContent(`
      <div class="flex items-center justify-center h-full">
        <div class="text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md">
          <span class="material-symbols-outlined text-red-400 text-4xl">wifi_off</span>
          <p class="font-semibold text-red-700 mt-2">No se puede conectar al servidor</p>
          <p class="text-sm text-slate-500 mt-1">Verifica que json-server esté corriendo en el puerto 3000</p>
        </div>
      </div>
    `);
    return;
  }

  renderBoard();
  bindSearchInput(filterCards);
}

function renderBoard() {
  const isAdmin = currentUser?.role === "admin";
  const visibleTasks = isAdmin
    ? allTasks
    : allTasks.filter(t => String(t.usuarioId) === String(currentUser.id));

  const summary = !isAdmin ? `
    <div class="grid grid-cols-4 gap-3 mb-6">
      ${COLUMNS.map(col => {
        const count = visibleTasks.filter(t => t.status === col.id).length;
        const colors = {
          "todo":        "bg-slate-50 border-slate-200 text-slate-700",
          "in-progress": "bg-blue-50 border-blue-200 text-blue-700",
          "review":      "bg-yellow-50 border-yellow-200 text-yellow-700",
          "done":        "bg-green-50 border-green-200 text-green-700",
        };
        return `
          <div class="border rounded-xl p-4 ${colors[col.id]}">
            <p class="text-2xl font-bold">${count}</p>
            <p class="text-xs font-medium mt-1">${col.label}</p>
          </div>`;
      }).join("")}
    </div>
    <p class="text-xs text-slate-400 mb-4">Mostrando tus ${visibleTasks.length} tarea(s) asignadas</p>
  ` : "";

  renderContent(`
    ${summary}
    <div class="flex gap-4 h-full min-h-0" id="kanban-board">
      ${COLUMNS.map(col => renderColumn(col, visibleTasks)).join("")}
    </div>
  `);
  attachCardListeners();
  initDragAndDrop();
}

function renderColumn(col, tasks) {
  const colTasks = tasks.filter(t => t.status === col.id);
  const countBg = col.id === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600";
  return `
    <div class="kanban-column flex flex-col w-1/4 min-w-[220px]" data-col="${col.id}">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-700 text-sm">${col.label}</h3>
        <span class="${countBg} text-xs px-2 py-0.5 rounded-full font-medium col-count">${colTasks.length}</span>
      </div>
      <div class="flex-1 space-y-3 p-2 bg-slate-100/60 rounded-2xl overflow-y-auto drop-zone" id="col-${col.id}">
        ${colTasks.length > 0
          ? colTasks.map(t => renderCard(t)).join("")
          : `<div class="text-center py-8 text-slate-400 text-xs">Sin tareas</div>`
        }
      </div>
    </div>
  `;
}

function renderCard(task) {
  const isAdmin  = currentUser?.role === "admin";
  const isOwner  = String(task.usuarioId) === String(currentUser?.id);
  const canEdit  = isAdmin || isOwner;
  const isDone   = task.status === "done";
  const isActive = task.status === "in-progress";

  const assignedUser = allUsers.find(u => String(u.id) === String(task.usuarioId));
  const assignedName = assignedUser ? assignedUser.nombre : "Sin asignar";
  const initial = assignedName[0]?.toUpperCase() || "?";

  return `
    <div class="task-card bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative group ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${isDone ? "opacity-70" : ""} ${isActive ? "border-l-4 border-l-blue-500" : ""}"
         draggable="${canEdit}" data-task-id="${task.id}" data-usuario-id="${task.usuarioId}">
      ${canEdit ? `
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button class="btn-edit p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" data-id="${task.id}">
            <span class="material-symbols-outlined text-[16px]">edit</span>
          </button>
          ${isAdmin ? `<button class="btn-delete p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-id="${task.id}">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>` : ""}
        </div>
      ` : ""}
      <h4 class="font-medium text-slate-800 text-sm mb-1 pr-12 ${isDone ? "line-through text-slate-400" : ""}">${task.titulo}</h4>
      <p class="text-xs text-slate-500 line-clamp-2 mb-3">${task.descripcion}</p>
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">${initial}</div>
        <span class="text-xs text-slate-500">${assignedName}</span>
        ${isDone ? `<span class="material-symbols-outlined text-green-500 text-[16px] ml-auto" style="font-variation-settings:'FILL' 1">check_circle</span>` : ""}
      </div>
    </div>
  `;
}

function attachCardListeners() {
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const task = allTasks.find(t => String(t.id) === btn.dataset.id);
      if (task) openTaskModal(task);
    });
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      openDeleteConfirm(btn.dataset.id);
    });
  });
}

function initDragAndDrop() {
  document.querySelectorAll(".task-card[draggable='true']").forEach(card => {
    card.addEventListener("dragstart", ev => {
      ev.dataTransfer.setData("text/plain", card.dataset.taskId);
      card.style.opacity = "0.4";
    });
    card.addEventListener("dragend", () => card.style.opacity = "1");
  });

  document.querySelectorAll(".drop-zone").forEach(zone => {
    zone.addEventListener("dragover", ev => {
      ev.preventDefault();
      zone.style.outline = "2px dashed #3b82f6";
      zone.style.backgroundColor = "rgba(59,130,246,0.05)";
    });
    zone.addEventListener("dragleave", () => {
      zone.style.outline = "";
      zone.style.backgroundColor = "";
    });
    zone.addEventListener("drop", async ev => {
      ev.preventDefault();
      zone.style.outline = "";
      zone.style.backgroundColor = "";

      const taskId    = ev.dataTransfer.getData("text/plain");
      const newStatus = zone.closest(".kanban-column").dataset.col;
      const task      = allTasks.find(t => String(t.id) === taskId);
      if (!task || task.status === newStatus) return;

      try {
        const updated = await actualizarTarea(task.id, { status: newStatus });
        const idx = allTasks.findIndex(t => t.id === task.id);
        if (idx !== -1) allTasks[idx] = updated;
        renderBoard();
        bindSearchInput(filterCards);
      } catch (err) {
        console.error("Error al mover tarea:", err);
      }
    });
  });
}

function filterCards(query) {
  const isAdmin = currentUser?.role === "admin";
  document.querySelectorAll(".task-card").forEach(card => {
    if (!isAdmin && String(card.dataset.usuarioId) !== String(currentUser.id)) {
      card.style.display = "none";
      return;
    }
    const title = card.querySelector("h4")?.textContent.toLowerCase() || "";
    const desc  = card.querySelector("p")?.textContent.toLowerCase() || "";
    card.style.display = (title.includes(query) || desc.includes(query)) ? "" : "none";
  });
}

function openTaskModal(task = null) {
  const isAdmin   = currentUser?.role === "admin";
  const isEditing = Boolean(task);

  const statusOpts = COLUMNS.map(col => `
    <option value="${col.id}" ${isEditing && task.status === col.id ? "selected" : ""}>${col.label}</option>
  `).join("");

  const userOpts = allUsers.map(u => `
    <option value="${u.id}" ${isEditing && String(task.usuarioId) === String(u.id) ? "selected" : ""}>${u.nombre} (${u.role})</option>
  `).join("");

  openModal(`
    <form id="task-form" onsubmit="return false;">
      <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200">
        <h2 class="font-bold text-lg text-slate-800">${isEditing ? "Editar Tarea" : "Nueva Tarea"}</h2>
        <button id="modal-close" type="button" class="material-symbols-outlined text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">close</button>
      </div>
      <div class="px-6 py-4 space-y-4">
        <p id="task-error" class="hidden text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg"></p>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Título</label>
          <input id="f-titulo" type="text" value="${isEditing ? task.titulo : ""}" ${!isAdmin ? "disabled" : ""} required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
          <textarea id="f-descripcion" rows="3" required
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none">${isEditing ? task.descripcion : ""}</textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Estado</label>
          <select id="f-status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">${statusOpts}</select>
        </div>
        ${isAdmin ? `
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Asignado a</label>
          <select id="f-usuario" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">${userOpts}</select>
        </div>` : ""}
      </div>
      <div class="flex justify-end gap-2 px-6 pb-6">
        <button id="modal-cancel" type="button" class="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
        <button id="modal-save" type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
          <span class="material-symbols-outlined text-[16px]">${isEditing ? "save" : "add_task"}</span>
          ${isEditing ? "Guardar" : "Crear tarea"}
        </button>
      </div>
    </form>
  `);

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("task-form").addEventListener("submit", () => handleSaveTask(task, isEditing, isAdmin));
}

function openDeleteConfirm(taskId) {
  openModal(`
    <div class="px-6 pt-6 pb-4 space-y-3">
      <div class="flex items-center gap-2 text-red-600">
        <span class="material-symbols-outlined text-2xl">delete_forever</span>
        <h2 class="font-bold text-lg">¿Eliminar tarea?</h2>
      </div>
      <p class="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
    </div>
    <div class="flex justify-end gap-2 px-6 pb-6">
      <button id="confirm-cancel" class="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
      <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">delete</span> Eliminar
      </button>
    </div>
  `);
  document.getElementById("confirm-cancel").addEventListener("click", closeModal);
  document.getElementById("confirm-delete").addEventListener("click", async () => {
    const btn = document.getElementById("confirm-delete");
    btn.disabled = true; btn.textContent = "Eliminando…";
    try {
      await eliminarTarea(taskId);
      allTasks = allTasks.filter(t => String(t.id) !== taskId);
      closeModal();
      renderBoard();
      bindSearchInput(filterCards);
    } catch { btn.disabled = false; btn.textContent = "Eliminar"; }
  });
}

async function handleSaveTask(task, isEditing, isAdmin) {
  const saveBtn     = document.getElementById("modal-save");
  const descripcion = document.getElementById("f-descripcion").value.trim();
  const status      = document.getElementById("f-status").value;
  const titulo      = isAdmin ? document.getElementById("f-titulo").value.trim() : (task?.titulo || "");
  const usuarioId   = isAdmin ? document.getElementById("f-usuario").value : (task?.usuarioId || currentUser.id);

  if (isAdmin && !titulo) { showModalError("El título es requerido."); return; }

  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Guardando…`;

  try {
    if (isEditing) {
      const payload = isAdmin ? { titulo, descripcion, status, usuarioId } : { descripcion, status };
      const updated = await actualizarTarea(task.id, payload);
      const idx = allTasks.findIndex(t => String(t.id) === String(task.id));
      if (idx !== -1) allTasks[idx] = updated;
    } else {
      const created = await crearTarea({ titulo, descripcion, status, usuarioId });
      allTasks.push(created);
    }
    closeModal();
    renderBoard();
    bindSearchInput(filterCards);
  } catch {
    showModalError("Error al guardar. Verifica la conexión.");
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${isEditing ? "save" : "add_task"}</span> ${isEditing ? "Guardar" : "Crear tarea"}`;
  }
}

function showModalError(msg) {
  const el = document.getElementById("task-error");
  if (el) { el.textContent = msg; el.classList.remove("hidden"); }
}