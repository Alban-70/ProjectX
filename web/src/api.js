import { getAccessToken } from "./auth.js";

const API_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Réponse invalide de l'API (${response.status})`);
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Erreur API HTTP ${response.status}`,
    );
  }

  return data;
}

export const api = {
  health() {
    return request("/health");
  },

  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },

  register(email, password) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });
  },

  me() {
    return request("/me");
  },

  logout() {
    return request("/auth/logout", {
      method: "POST",
    });
  },

  forgotPassword(email) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    });
  },

  resetPassword(accessToken, refreshToken, password) {
    return request("/auth/reset-password", {
      method: "POST",

      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        password,
      }),
    });
  },

  refreshSession(refreshToken) {
    return request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
  },

  createProject(data) {
    return request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  categories() {
    return request("/categories");
  },

  dashboard() {
    return request("/dashboard");
  },

  logGoal(goalId, value, note = "") {
    return request(`/dashboard/goals/${goalId}/log`, {
      method: "POST",
      body: JSON.stringify({
        value,
        note,
      }),
    });
  },

  logHabit(habitId, value = 1, note = "") {
    return request(`/dashboard/habits/${habitId}/log`, {
      method: "POST",
      body: JSON.stringify({
        value,
        note,
      }),
    });
  },

  completeMilestone(milestoneId) {
    return request(`/dashboard/milestones/${milestoneId}/complete`, {
      method: "PATCH",
    });
  },

  reopenMilestone(milestoneId) {
    return request(`/dashboard/milestones/${milestoneId}/reopen`, {
      method: "PATCH",
    });
  },

  saveCheckin(data) {
    return request("/dashboard/checkin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
