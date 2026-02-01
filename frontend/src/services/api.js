import { getToken } from "./auth";

const BASE = `${process.env.REACT_APP_API_BASE_URL}/api/routes`;

const getAuthHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

/**
 * Helper to handle the response and check for 401/403
 */
async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    // Clear any dead token and kick to login
    localStorage.removeItem("token"); 
    window.location.href = "/login"; 
    return;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Request failed");
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

/* SEARCH ROUTE */
export async function searchRoutes(stop1, stop2, mode = "shortest") {
  const res = await fetch(
    `${BASE}/search?stop1=${encodeURIComponent(stop1)}&stop2=${encodeURIComponent(
      stop2
    )}&mode=${mode}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

/* GET ALL ROUTES */
export async function getAllRoutes() {
  const res = await fetch(`${BASE}/all`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

/* ⭐ GET ALL STOP NAMES */
export async function fetchStops() {
  const res = await fetch(`${BASE}/stops`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}
