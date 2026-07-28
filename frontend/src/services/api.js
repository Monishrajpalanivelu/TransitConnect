import { getToken } from "./auth";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const BASE = `${API_BASE}/api/routes`;

const getAuthHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }
  if (!res.ok) {
    let errorText = "Request failed";
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        errorText = json.message || json.error || text || errorText;
      } catch (e) {
        errorText = text || errorText;
      }
    } catch (e) { /* ignore */ }
    throw new Error(errorText);
  }
  return res.json();
}

/* ADD ROUTE */
export async function addRoute(payload) {
  const res = await fetch(`${BASE}/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/* UPDATE ROUTE */
export async function updateRoute(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/* DELETE ROUTE */
export async function deleteRoute(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Delete failed");
  }
}

/* SEARCH ROUTE */
export async function searchRoutes(stop1, stop2) {
  const res = await fetch(
    `${BASE}/search?stop1=${encodeURIComponent(stop1)}&stop2=${encodeURIComponent(stop2)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(res);
}

/* GET ALL ROUTES */
export async function getAllRoutes() {
  const res = await fetch(`${BASE}/all`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

/**
 * Autocomplete stop names with server-side prefix search.
 * @param {string} query - typed prefix (e.g. "ben")
 * @param {number} limit - max results (default 10)
 */
export async function fetchStops(query = "", limit = 10) {
  const url = query
    ? `${BASE}/stops?q=${encodeURIComponent(query)}&limit=${limit}`
    : `${BASE}/stops`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}
