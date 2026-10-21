import React from 'react';
import Card from '../ui/Card';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  className = '' 
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card className={`hover-lift ${className}`} padding="lg">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            {React.cloneElement(icon, { size: 24 })}
          </div>
        </div>
        
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 animate-bounce">{value}</p>
          
          {trend && trendValue && (
            <div className={`flex items-center mt-1 text-sm ${trendColors[trend]}`}>
              <span>{trendValue}</span>
              <span className="ml-1 text-gray-500">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const StatsGrid = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="stagger-item">
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;