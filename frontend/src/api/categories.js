import { getAuthHeaders } from '../utils/tokenUtils';

const base = "/api/categories";

export async function fetchCategories(page = 1, limit = 50) {
  const res = await fetch(`${base}?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to fetch categories");
  }
  return res.json();
}

export async function createCategory(payload) {
  const res = await fetch(base, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to create category");
  }
  return res.json();
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${base}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to update category");
  }
  return res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(`${base}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to delete category");
  }
  return res.json();
}

// Only named exports, no duplicate default export
