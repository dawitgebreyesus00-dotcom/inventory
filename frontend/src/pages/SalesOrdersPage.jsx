import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Truck, CheckCircle, XCircle, Users } from 'lucide-react';
import { tokenUtils } from '../utils/tokenUtils';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const SalesOrdersPage = () => {
  const { user } = useAuth();
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', customer: '', search: '' });

  const [newOrder, setNewOrder] = useState({
    customer: '',
    items: [{ product: '', quantity: 1, unitPrice: 0 }],
    notes: ''
  });

  const canCreate = ['admin', 'manager'].includes(user?.role);
  const canUpdate = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch(`/api/sales-orders?${new URLSearchParams(filters)}`, {
          headers: { Authorization: `Bearer ${tokenUtils.getToken()}` }
        }),
        fetch('/api/users?role=customer', {
          headers: { Authorization: `Bearer ${tokenUtils.getToken()}` }
        }),
        fetch('/api/products', {
          headers: { Authorization: `Bearer ${tokenUtils.getToken()}` }
        })
      ]);

      const [ordersData, customersData, productsData] = await Promise.all([
        ordersRes.json(), customersRes.json(), productsRes.json()
      ]);

      setSalesOrders(ordersData.orders || []);
      setCustomers(customersData.data || customersData || []);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    try {
      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUtils.getToken()}`
        },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewOrder({ customer: '', items: [{ product: '', quantity: 1, unitPrice: 0 }], notes: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating sales order:', error);
    }
  };

  const updateStatus = async (id, status) => {
    if (!canUpdate) return;

    try {
      await fetch(`/api/sales-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUtils.getToken()}`
        },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'primary',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'default';
  };

  const addItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { product: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateItem = (index, field, value) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Sales Orders"
        subtitle="Manage customer orders and track sales"
        breadcrumbs={['Dashboard', 'Sales Orders']}
        actions={canCreate ? [
          <Button
            key="create"
            onClick={() => setShowCreateForm(true)}
            icon={<Plus />}
          >
            New Sales Order
          </Button>
        ] : []}
      />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon={<Search />}
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.customer}
              onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>{customer.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Sales Orders Table */}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Order Number</Table.Head>
              <Table.Head>Customer</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Total Amount</Table.Head>
              <Table.Head>Order Date</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {salesOrders.map(order => (
              <Table.Row key={order._id}>
                <Table.Cell className="font-medium">{order.orderNumber}</Table.Cell>
                <Table.Cell>{order.customer?.name}</Table.Cell>
                <Table.Cell>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>${order.totalAmount?.toFixed(2)}</Table.Cell>
                <Table.Cell>
                  {new Date(order.orderDate).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    {canUpdate && order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order._id, 'confirmed')}
                        icon={<CheckCircle />}
                        variant="success"
                      >
                        Confirm
                      </Button>
                    )}
                    {canUpdate && order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order._id, 'shipped')}
                        icon={<Truck />}
                        variant="primary"
                      >
                        Ship
                      </Button>
                    )}
                    {canUpdate && ['pending', 'confirmed'].includes(order.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order._id, 'cancelled')}
                        icon={<XCircle />}
                        variant="danger"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {/* Create Order Modal */}
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create Sales Order"
          size="lg"
        >
          <form onSubmit={handleCreateOrder}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <select
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customer: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Items</label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="border rounded px-2 py-1"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="border rounded px-2 py-1"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      className="border rounded px-2 py-1"
                      step="0.01"
                      min="0"
                      required
                    />
                    <span className="flex items-center px-2">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addItem}
                  variant="ghost"
                  size="sm"
                >
                  + Add Item
                </Button>
              </div>

              <Input
                label="Notes"
                value={newOrder.notes}
                onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Order notes..."
              />
            </div>

            <Modal.Footer>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Sales Order
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default SalesOrdersPage;