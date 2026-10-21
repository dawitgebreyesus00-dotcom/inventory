import { apiRequest } from '../utils/apiWrapper';
import { getAuthHeaders } from '../utils/tokenUtils';

const base = '/api/products';

export async function fetchProducts(page = 1, limit = 500) {
  const res = await apiRequest(`${base}?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch products');
  }
  return res.json();
}

export async function getProduct(id) {
  const res = await apiRequest(`${base}/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch product');
  }
  return res.json();
}

export async function createProduct(payload) {
  const res = await apiRequest(base, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id, payload) {
  const res = await apiRequest(`${base}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to update product');
  }
  return res.json();
}

export async function deleteProduct(id) {
  const res = await apiRequest(`${base}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to delete product');
  }
  return res.json();
}
