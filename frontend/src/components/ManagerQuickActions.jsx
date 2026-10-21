import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, TrendingUp, Truck, BarChart3, 
  AlertTriangle, CheckCircle, Clock, Target 
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

const ManagerQuickActions = () => {
  const navigate = useNavigate();

  const urgentTasks = [
    { 
      title: 'Weekly Stock Count', 
      description: 'Electronics section due today',
      action: () => navigate('/admin-dashboard/stock-adjustments'),
      priority: 'high',
      time: '2:00 PM'
    },
    { 
      title: 'Receive Delivery', 
      description: 'TechCorp shipment arriving',
      action: () => navigate('/admin-dashboard/purchase-orders'),
      priority: 'medium',
      time: '4:00 PM'
    }
  ];

  const quickActions = [
    {
      title: 'Stock Adjustment',
      description: 'Record damaged/lost items',
      icon: <TrendingUp />,
      action: () => navigate('/admin-dashboard/stock-adjustments'),
      color: 'bg-purple-100 text-purple-600',
      buttonVariant: 'outline'
    },
    {
      title: 'Receive Stock',
      description: 'Process incoming deliveries',
      icon: <Truck />,
      action: () => navigate('/admin-dashboard/purchase-orders'),
      color: 'bg-green-100 text-green-600',
      buttonVariant: 'success'
    },
    {
      title: 'Physical Count',
      description: 'Perform inventory counting',
      icon: <Package />,
      action: () => navigate('/admin-dashboard/products'),
      color: 'bg-blue-100 text-blue-600',
      buttonVariant: 'primary'
    },
    {
      title: 'Stock Reports',
      description: 'View inventory analytics',
      icon: <BarChart3 />,
      action: () => navigate('/admin-dashboard/reports'),
      color: 'bg-orange-100 text-orange-600',
      buttonVariant: 'warning'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Urgent Tasks */}
      <Card className="stagger-item">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Clock className="text-red-600" size={20} />
            Urgent Tasks Today
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            {urgentTasks.map((task, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  task.priority === 'high' ? 'border-red-500 bg-red-50' : 
                  task.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.priority === 'high' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">Due: {task.time}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={task.priority === 'high' ? 'danger' : 'warning'}
                    onClick={task.action}
                  >
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Quick Actions Grid */}
      <Card className="stagger-item">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Target className="text-blue-600" size={20} />
            Manager Operations
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover-lift"
                onClick={action.action}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mx-auto mb-3`}>
                    {React.cloneElement(action.icon, { size: 20 })}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{action.title}</h4>
                  <p className="text-xs text-gray-600 mb-3">{action.description}</p>
                  <Button
                    size="sm"
                    variant={action.buttonVariant}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                  >
                    {action.title}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ManagerQuickActions;