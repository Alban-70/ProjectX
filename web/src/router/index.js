import { createRouter, createWebHistory } from "vue-router";

import { isAuthenticated, restoreSession } from "../auth.js";
import { api } from "../api.js";

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: "/login",
      name: "login",
      component: () => import("../components/Login.vue"),
    },

    {
      path: "/register",
      name: "register",
      component: () => import("../components/Register.vue"),
    },

    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../components/ForgotPassword.vue"),
    },

    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../components/ResetPassword.vue"),
    },

    {
      path: "/projects/new",
      name: "create-project",
      component: () => import("../views/CreateProjectView.vue"),
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

router.beforeEach(async (to) => {
  const session = await restoreSession(api);

  const authenticated = !!session;

  if (to.meta.requiresAuth && !authenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (authenticated && (to.name === "login" || to.name === "register")) {
    return {
      name: "home",
    };
  }

  return true;
});

export default router;
