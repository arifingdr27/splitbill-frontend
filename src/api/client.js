const RAW_V2 =
  import.meta.env.VITE_API_URL ||
  'https://splitbill-api.nrarivin.online/api/v2';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  RAW_V2.replace(/\/api\/v2\/?$/, '') ||
  'https://splitbill-api.nrarivin.online';

export const OCR_URL = `${API_BASE_URL}/api/v2`;

export const TOKEN_KEY = 'splitbill_jwt';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
