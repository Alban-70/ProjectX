const SESSION_KEY = "project_x_session";
const USER_KEY = "project_x_user";

export function saveSession(session, user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession() {
  const value = localStorage.getItem(SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getUser() {
  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  const session = getSession();

  return session?.access_token || null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export function getRefreshToken() {
  const session = getSession();

  return session?.refresh_token || null;
}

export async function restoreSession(api) {
  const session = getSession();

  if (!session) {
    return null;
  }

  const expiresAt = session.expires_at;

  if (expiresAt && Date.now() < expiresAt * 1000) {
    return session;
  }

  const refreshToken = session.refresh_token;

  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const data = await api.refreshSession(refreshToken);

    saveSession(data.session, data.user);

    return data.session;
  } catch {
    logout();
    return null;
  }
}