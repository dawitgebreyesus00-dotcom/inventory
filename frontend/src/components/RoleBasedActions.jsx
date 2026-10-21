import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Package, CheckCircle, AlertTriangle, 
  BarChart3, Settings, Truck, FileText 
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

const RoleBasedActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminActions = [
    {
      title: 'Approve Orders',
      description: 'Review and approve pending orders',
      icon: <CheckCircle />,
      action: () => navigate('/admin-dashboard/approvals'),
      variant: 'success',
      urgent: true
    },
    {
      title: 'Manage Users',
      description: 'Add users and assign roles',
      icon: <Users />,
      action: () => navigate('/admin-dashboard/users'),
      variant: 'primary'
    },
    {
      title: 'System Reports',
      description: 'Monitor system performance',
      icon: <BarChart3 />,
      action: () => navigate('/admin-dashboard/reports'),
      variant: 'secondary'
    },
    {
      title: 'System Settings',
      description: 'Configure system rules',
      icon: <Settings />,
      action: () => navigate('/admin-dashboard/settings'),
      variant: 'outline'
    }
  ];

  const managerActions = [
    {
      title: 'Stock Count',
      description: 'Perform weekly stock counting',
      icon: <Package />,
      action: () => navigate('/admin-dashboard/stock-count'),
      variant: 'primary',
      urgent: true
    },
    {
      title: 'Stock Adjustments',
      description: 'Record damaged/returned items',
      icon: <AlertTriangle />,
      action: () => navigate('/admin-dashboard/stock-adjustments'),
      variant: 'warning'
    },
    {
      title: 'Receive Stock',
      description: 'Process incoming deliveries',
      icon: <Truck />,
      action: () => navigate('/admin-dashboard/receive-stock'),
      variant: 'success'
    },
    {
      title: 'Reorder Reports',
      description: 'Check items needing reorder',
      icon: <FileText />,
      action: () => navigate('/admin-dashboard/reorder-report'),
      variant: 'secondary'
    }
  ];

  const viewerActions = [
    {
      title: 'Stock Reports',
      description: 'View current stock levels',
      icon: <BarChart3 />,
      action: () => navigate('/admin-dashboard/reports'),
      variant: 'primary'
    },
    {
      title: 'Low Stock Alert',
      description: 'Monitor reorder levels',
      icon: <AlertTriangle />,
      action: () => navigate('/admin-dashboard/low-stock'),
      variant: 'warning'
    }
  ];

  const getActionsForRole = () => {
    switch (user?.role) {
      case 'admin':
        return adminActions;
      case 'manager':
        return managerActions;
      case 'viewer':
        return viewerActions;
      default:
        return [];
    }
  };

  const actions = getActionsForRole();

  if (actions.length === 0) return null;

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {user?.role === 'admin' && 'Admin Quick Actions'}
          {user?.role === 'manager' && 'Inventory Management'}
          {user?.role === 'viewer' && 'Reports & Monitoring'}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${
                action.urgent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  action.variant === 'success' ? 'bg-green-100 text-green-600' :
                  action.variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  action.variant === 'primary' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {React.cloneElement(action.icon, { size: 18 })}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {action.title}
                    {action.urgent && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Urgent
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <Button
                    size="sm"
                    variant={action.variant}
                    onClick={action.action}
                    className="w-full"
                  >
                    {action.title}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};

export default RoleBasedActions;