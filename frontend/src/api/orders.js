import { apiRequest } from '../utils/apiWrapper';

const base = '/api/orders';

export async function fetchOrders() {
  const res = await apiRequest(base);
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message || 'Failed to fetch orders');
  }
  return res.json();
}

export async function fetchMyOrders() {
  const res = await apiRequest(`${base}/my`);
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.message || 'Failed to fetch your orders');
  }
  return res.json();
}

export async function getOrder(id) {
  const res = await apiRequest(`${base}/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch order');
  }
  return res.json();
}

export async function createOrder(payload) {
  const res = await apiRequest(base, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to place order');
  }
  return res.json();
}

export async function updateOrderStatus(id, status) {
  if (!id || !status) {
    throw new Error('Order ID and status are required');
  }
  
  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
  }
  
  const res = await apiRequest(`${base}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to update order status');
  }
  return res.json();
}

export async function deleteOrder(id) {
  const res = await apiRequest(`${base}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to delete order');
  }
  return res.json();
}

export async function updateOrder(id, payload) {
  const res = await apiRequest(`${base}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to update order');
  }
  return res.json();
}
