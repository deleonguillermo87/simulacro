// src/js/layout.js
import { getSession, clearSession } from "./auth.js";
import { navigate } from "./router.js";

let shellActionHandler = null;

export function mountShell(activePath) {
  const app = document.getElementById("app");

  if (!document.getElementById("board-scroll")) {
    const currentUser = getSession();
    const isAdmin = currentUser?.role === "admin";

    document.body.className = "bg-slate-50 text-slate-900 overflow-hidden h-screen flex";
    app.className = "flex w-full h-full overflow-hidden";

    app.innerHTML = `
      ${buildSidebar(isAdmin)}
      <main class="flex-1 flex flex-col min-w-0">
        ${buildHeader(currentUser)}
        <div class="flex-1 overflow-x-auto p-6 overflow-y-auto" id="board-scroll"></div>
      </main>
      ${buildModalOverlay()}
    `;

    attachShellListeners();
  }

  updateActiveNav(activePath);
}

export function renderContent(html) {
  const container = document.getElementById("board-scroll");
  if (container) container.innerHTML = html;
}

function buildSidebar(isAdmin) {
  return `
  <aside class="hidden md:flex flex-col h-full bg-white border-r border-slate-200 w-[260px] shrink-0">
    <div class="p-6 border-b border-slate-100">
      <h1 class="text-2xl font-bold text-blue-600">Proyecto G</h1>
      <p class="text-xs text-slate-500 mt-0.5">Engineering Team</p>
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <a id="nav-dashboard" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-slate-600 hover:bg-slate-100 text-sm">
        <span class="material-symbols-outlined text-[20px]"></span><span>Dashboard</span>
      </a>
      </a>
      <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-slate-400 text-sm opacity-60">
        <span class="material-symbols-outlined text-[20px]"></span><span>Projects</span>
      </a>
      ${isAdmin ? `
      <a id="nav-team" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-slate-600 hover:bg-slate-100 text-sm">
        <span class="material-symbols-outlined text-[20px]"></span><span>TEAM</span>
      </a>` : ""}
      <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-slate-400 text-sm opacity-60">
        <span class="material-symbols-outlined text-[20px]"></span><span>Reports</span>
      </a>
      <a class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed text-slate-400 text-sm opacity-60">
        <span class="material-symbols-outlined text-[20px]"></span><span>Settings</span>
      </a>
    </nav>
    <div class="p-4">
      ${isAdmin ? `
      <button id="shell-action-btn" class="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
        <span class="material-symbols-outlined text-[18px]">add</span>
        <span id="shell-action-label">New Action</span>
      </button>` : ""}
    </div>
  </aside>`;
}

function buildHeader(currentUser) {
  const inicial = currentUser?.nombre?.[0]?.toUpperCase() || "U";
  return `
  <header class="flex justify-between items-center h-14 px-6 bg-white border-b border-slate-200 shrink-0">
    <div class="relative max-w-xs w-full">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]"></span>
      <input id="search-input" class="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." type="text" />
    </div>
    <div class="flex items-center gap-3">
      <button class="material-symbols-outlined text-slate-500 hover:bg-slate-100 p-2 rounded-full text-[20px]">notifications</button>
      <div id="logout-btn" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-blue-200 transition-colors" title="Logout">${inicial}</div>
    </div>
  </header>`;
}

function buildModalOverlay() {
  return `<div id="modal-overlay" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div id="modal-box" class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"></div>
  </div>`;
}

function attachShellListeners() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    navigate("/login");
  });

  document.getElementById("nav-dashboard").addEventListener("click", () => navigate("/dashboard"));
  document.getElementById("nav-team")?.addEventListener("click", () => navigate("/team"));

  document.getElementById("shell-action-btn")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("shell:action"));
  });

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });
}

function updateActiveNav(activePath) {
  const navMap = { "/dashboard": "nav-dashboard", "/team": "nav-team" };
  Object.values(navMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-slate-600 hover:bg-slate-100 text-sm";
  });
  const activeId = navMap[activePath];
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.className = "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all bg-blue-50 text-blue-700 font-medium text-sm";
}

export function openModal(html) {
  const box = document.getElementById("modal-box");
  if (box) {
    box.innerHTML = html;
    document.getElementById("modal-overlay")?.classList.remove("hidden");
  }
}

export function closeModal() {
  document.getElementById("modal-overlay")?.classList.add("hidden");
}

export function updateSidebarActionBtn({ icon, label }) {
  const btn = document.getElementById("shell-action-btn");
  const lbl = document.getElementById("shell-action-label");
  if (btn) {
    btn.querySelector(".material-symbols-outlined").textContent = icon;
    if (lbl) lbl.textContent = label;
  }
}

export function setShellActionHandler(handler) {
  if (shellActionHandler) window.removeEventListener("shell:action", shellActionHandler);
  shellActionHandler = handler;
  if (shellActionHandler) window.addEventListener("shell:action", shellActionHandler);
}

export function bindSearchInput(onInput) {
  const input = document.getElementById("search-input");
  if (!input || typeof onInput !== "function") return;
  input.oninput = () => onInput(input.value.trim().toLowerCase());
}