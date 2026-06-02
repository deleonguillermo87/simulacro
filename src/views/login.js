// src/views/login.js
import { loginUser } from "../js/api.js";
import { saveSession } from "../js/auth.js";
import { navigate } from "../js/router.js";

const login = {
  render: () => {
    return `
      <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div class="w-full max-w-md">
          <div class="text-center mb-10">
            <h1 class="text-5xl font-bold text-white">Simulacro</h1>
            <p class="text-slate-400 mt-2">Engineering Projects</p>
          </div>

          <div class="bg-white rounded-3xl p-10 shadow-xl">
            <h2 class="text-2xl font-semibold text-center mb-8">Sign in</h2>

            <form id="loginForm" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">Email address</label>
                <input id="email" type="email" required class="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
                <input id="password" type="password" required class="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500">
              </div>

              <p id="login-error" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-2xl text-center"></p>

              <button id="login-btn" type="submit" class="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-medium hover:bg-blue-700 transition">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  mounted: () => {
    const form = document.getElementById("loginForm");
    const errorEl = document.getElementById("login-error");
    const btn = document.getElementById("login-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      btn.disabled = true;
      btn.textContent = "Signing in...";
      errorEl.classList.add("hidden");

      try {
        const user = await loginUser(email, password);
        if (user) {
          saveSession(user);
          navigate("/dashboard");
        } else {
          errorEl.textContent = "Credenciales incorrectas";
          errorEl.classList.remove("hidden");
        }
      } catch (err) {
        errorEl.textContent = "Error de conexión";
        errorEl.classList.remove("hidden");
      }

      btn.disabled = false;
      btn.textContent = "Login";
    });
  }
};

export default login;