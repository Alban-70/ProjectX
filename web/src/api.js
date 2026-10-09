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

  logHabit(habitId, value = 1, note = "", date) {
    return request(`/dashboard/habits/${habitId}/log`, {
      method: "POST",
      body: JSON.stringify({ value, note, ...(date ? { date } : {}) }),
    });
  },

  createHabit(data) {
    return request("/dashboard/habits", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateHabit(habitId, data) {
    return request(`/dashboard/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteHabit(habitId) {
    return request(`/dashboard/habits/${habitId}`, {
      method: "DELETE",
    });
  },

  getHabitHistory(habitId) {
    return request(`/dashboard/habits/${habitId}/history`);
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

  createGoal(data) {
    return request("/dashboard/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateGoal(goalId, data) {
    return request(`/dashboard/goals/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteGoal(goalId) {
    return request(`/dashboard/goals/${goalId}`, {
      method: "DELETE",
    });
  },

  getJournalEntries({ search = "", from = "", to = "" } = {}) {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const query = params.toString();

    return request(`/dashboard/journal${query ? `?${query}` : ""}`);
  },

  createJournalEntry(data) {
    return request("/dashboard/journal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateJournalEntry(entryId, data) {
    return request(`/dashboard/journal/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteJournalEntry(entryId) {
    return request(`/dashboard/journal/${entryId}`, {
      method: "DELETE",
    });
  },
};
