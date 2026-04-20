/**
 * Centralized API client for WhiskerWatch frontend.
 *
 * Every call returns a consistent shape:
 *   { ok: true,  data: <parsed JSON> }
 *   { ok: false, error: <string>, status: <number> }
 *
 * Handles network failures, non-2xx responses, and JSON parse errors
 * so calling components never need bare try/catch around fetch.
 */

const BASE = '/api';

/**
 * @param {string} path    - API path (e.g., "/cats" or "/cats/1/logs")
 * @param {object} [options] - fetch options (method, body, etc.)
 * @returns {Promise<{ ok: true, data: any } | { ok: false, error: string, status: number }>}
 */
export async function apiFetch(path, options = {}) {
  const { body, ...rest } = options;
  const fetchOptions = {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...rest.headers },
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, fetchOptions);
  } catch {
    return { ok: false, error: 'Network error — is the server running?', status: 0 };
  }

  // 204 No Content (deletes) — no body to parse
  if (res.status === 204) {
    return { ok: true, data: null };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Invalid response from server', status: res.status };
  }

  if (!res.ok) {
    return { ok: false, error: data.error || `Request failed (${res.status})`, status: res.status };
  }

  return { ok: true, data };
}
