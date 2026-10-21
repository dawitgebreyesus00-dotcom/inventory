import { getAuthHeaders } from '../utils/tokenUtils';

const base = '/api/suppliers';

export async function fetchSuppliers() {
  const res = await fetch(base, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch suppliers');
  }
  return res.json();
}

export async function createSupplier(payload) {
  const res = await fetch(base, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create supplier');
  }
  return res.json();
}

export async function updateSupplier(id, payload) {
  const res = await fetch(`${base}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to update supplier');
  }
  return res.json();
}

export async function deleteSupplier(id) {
  const res = await fetch(`${base}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to delete supplier');
  }
  return res.json();
}
