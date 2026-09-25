import { API_URL } from './config';

/** Error with the HTTP status (0 = network/timeout) and the backend's error code. */
export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/** JSON request helper with a timeout. `token` is sent as a Bearer token. */
export async function api(path, { method = 'GET', body, token, timeout = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'offline');
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const detail = data && data.detail;
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'validation_error');
  }
  return data;
}

/** Fetches an authenticated image and returns an object URL (caller revokes it). */
export async function fetchImage(path, token) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiError(res.status, 'no_photo');
  return URL.createObjectURL(await res.blob());
}
