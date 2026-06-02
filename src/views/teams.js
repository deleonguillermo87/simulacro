// src/views/teams.js
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from "../js/api.js";
import { getSession } from "../js/auth.js";
import { mountShell, renderContent, openModal, closeModal, updateSidebarActionBtn, setShellActionHandler, bindSearchInput } from "../js/layout.js";

let currentUser = null;
let allUsers    = [];

export async function mostrarTeams() {
  currentUser = getSession();
  const isAdmin = currentUser?.role === "admin";

  mountShell("/team");

  if (isAdmin) {
    updateSidebarActionBtn({ icon: "person_add", label: "New Member" });
    setShellActionHandler(() => { resetForm(); document.getElementById("f-nombre")?.focus(); });
  }

  await loadAndRender();
  bindSearchInput(filterUsers);
}

async function loadAndRender() {
  try {
    allUsers = await getUsuarios();
    renderBento();
  } catch {
    renderContent(`<div class="p-6 text-red-600 bg-red-50 rounded-2xl">Error al conectar con el servidor.</div>`);
  }
}

function renderBento() {
  const isAdmin = currentUser?.role === "admin";

  renderContent(`
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Team Directory</h2>
        <p class="text-slate-500 text-sm mt-1">Gestiona roles y miembros del equipo.</p>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        ${isAdmin ? `
        <section class="xl:col-span-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-4">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span class="material-symbols-outlined text-blue-600 text-[20px]" id="form-icon">person_add</span>
            </div>
            <form id="user-form" onsubmit="return false;" class="space-y-3">
              <input type="hidden" id="f-id" value=""/>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Nombre completo</label>
                <input id="f-nombre" type="text" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" placeholder="Ej. María Sánchez"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input id="f-email" type="email" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" placeholder="maria@company.com"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Contraseña</label>
                <input id="f-password" type="password" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" placeholder="••••••••"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Rol</label>
                <select id="f-role" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <p id="form-error" class="hidden text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg"></p>
              <div class="flex gap-2 pt-1">
                <button id="btn-cancel" type="button" class="hidden flex-1 border border-slate-200 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                <button id="btn-submit" type="submit" class="flex-[2] bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                </button>
              </div>
            </form>
          </div>
        </section>` : ""}

        <section class="${isAdmin ? "xl:col-span-8" : "xl:col-span-12"}">
          <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 class="font-semibold text-slate-700">Miembros activos</h3>
              <span class="text-xs text-slate-400">${allUsers.length} total</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-slate-200 text-xs text-slate-500 font-medium">
                    <th class="px-5 py-3">Miembro</th>
                    <th class="px-5 py-3">Email</th>
                    <th class="px-5 py-3">Rol</th>
                    ${isAdmin ? `<th class="px-5 py-3 text-right">Acciones</th>` : ""}
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100" id="team-body">
                  ${allUsers.map(u => renderRow(u, isAdmin)).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  `);

  attachListeners();
}

function renderRow(user, isAdmin) {
  const isSelf = String(user.id) === String(currentUser?.id);
  const roleClass = user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600";
  return `
  <tr class="user-row hover:bg-slate-50 transition-colors group">
    <td class="px-5 py-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">${user.nombre[0].toUpperCase()}</div>
        <div>
          <p class="text-sm font-medium text-slate-800">${user.nombre}</p>
          ${isSelf ? `<span class="text-[10px] text-blue-600 font-bold">TÚ</span>` : ""}
        </div>
      </div>
    </td>
    <td class="px-5 py-3 text-sm text-slate-500">${user.email}</td>
    <td class="px-5 py-3">
      <span class="${roleClass} px-2 py-0.5 rounded-full text-xs font-medium capitalize">${user.role}</span>
    </td>
    ${isAdmin ? `
    <td class="px-5 py-3 text-right">
      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="btn-edit-user p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" data-id="${user.id}">
          <span class="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button class="btn-delete-user p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ${isSelf ? "opacity-30 cursor-not-allowed" : ""}" data-id="${user.id}" ${isSelf ? "disabled" : ""}>
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </td>` : ""}
  </tr>`;
}

function attachListeners() {
  const form = document.getElementById("user-form");
  if (!form) return;
  form.addEventListener("submit", handleSaveUser);
  document.getElementById("btn-cancel")?.addEventListener("click", resetForm);
  document.querySelectorAll(".btn-edit-user").forEach(btn => {
    btn.addEventListener("click", () => {
      const user = allUsers.find(u => String(u.id) === String(btn.dataset.id));
      if (user) loadIntoForm(user);
    });
  });
  document.querySelectorAll(".btn-delete-user").forEach(btn => {
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
  });
}

function loadIntoForm(user) {
  document.getElementById("f-id").value       = user.id;
  document.getElementById("f-nombre").value   = user.nombre;
  document.getElementById("f-email").value    = user.email;
  document.getElementById("f-role").value     = user.role;
  document.getElementById("f-password").value = "";
  document.getElementById("form-title").textContent = "Editar miembro";
  document.getElementById("form-icon").textContent  = "edit";
  document.getElementById("btn-cancel").classList.remove("hidden");
  document.getElementById("f-nombre").focus();
}

function resetForm() {
  document.getElementById("user-form")?.reset();
  document.getElementById("f-id").value = "";
  document.getElementById("form-title").textContent = "Agregar miembro";
  document.getElementById("form-icon").textContent  = "person_add";
  document.getElementById("btn-cancel").classList.add("hidden");
  document.getElementById("form-error").classList.add("hidden");
}

async function handleSaveUser() {
  const submitBtn = document.getElementById("btn-submit");
  const id = document.getElementById("f-id").value;
  const data = {
    nombre:   document.getElementById("f-nombre").value.trim(),
    email:    document.getElementById("f-email").value.trim(),
    role:     document.getElementById("f-role").value,
    password: document.getElementById("f-password").value,
  };
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Guardando…`;
  try {
    if (id) {
      if (!data.password) delete data.password;
      await actualizarUsuario(id, data);
    } else {
      if (!data.password) throw new Error("Contraseña requerida");
      await crearUsuario(data);
    }
    await loadAndRender();
    resetForm();
  } catch {
    const errEl = document.getElementById("form-error");
    errEl.textContent = "Error al guardar. Verifica los datos.";
    errEl.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">save</span> Guardar`;
  }
}

function openDeleteModal(id) {
  const user = allUsers.find(u => String(u.id) === String(id));
  openModal(`
    <div class="px-6 pt-6 pb-4 space-y-3">
      <div class="flex items-center gap-2 text-red-600">
        <span class="material-symbols-outlined text-2xl">person_remove</span>
        <h2 class="font-bold text-lg">¿Eliminar miembro?</h2>
      </div>
      <p class="text-sm text-slate-500">¿Seguro que quieres eliminar a <b>${user?.nombre}</b>?</p>
    </div>
    <div class="flex justify-end gap-2 px-6 pb-6">
      <button id="modal-cancel" class="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
      <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">delete</span> Eliminar
      </button>
    </div>
  `);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("confirm-delete").addEventListener("click", async () => {
    const btn = document.getElementById("confirm-delete");
    btn.disabled = true; btn.textContent = "Eliminando…";
    await eliminarUsuario(id);
    closeModal();
    loadAndRender();
  });
}

function filterUsers(query) {
  document.querySelectorAll("#team-body tr.user-row").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
  });
}