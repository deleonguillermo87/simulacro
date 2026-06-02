// src/js/router.js
import login from "../views/login.js";
import { mostrarDashboard } from "../views/dashboard.js";
import { mostrarTeams } from "../views/teams.js";
import { getSession } from "./auth.js";

export function navigate(path) {
  history.pushState({}, "", path);
  router();
}

window.navigate = navigate;

export function router() {
  const path = location.pathname || "/";
  const session = getSession();

  if (!session && path !== "/login") {
    navigate("/login");
    return;
  }

  if (session && path === "/login") {
    navigate("/dashboard");
    return;
  }

  if (path === "/team" && session?.role !== "admin") {
    navigate("/dashboard");
    return;
  }

  const app = document.getElementById("app");

  if (path === "/login") {
    app.innerHTML = login.render();
    login.mounted();
    return;
  }

  if (path === "/dashboard") {
    mostrarDashboard();
  } else if (path === "/team") {
    mostrarTeams();
  } else {
    navigate("/dashboard");
  }
}

window.addEventListener("popstate", router);