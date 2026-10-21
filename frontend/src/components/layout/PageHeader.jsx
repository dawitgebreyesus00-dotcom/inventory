import React from 'react';
import Button from '../ui/Button';

const PageHeader = ({ 
  title, 
  subtitle, 
  actions, 
  breadcrumbs,
  className = '' 
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 animate-slideIn ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {breadcrumbs && (
            <nav className="flex mb-2" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <span className="mx-2 text-gray-400">/</span>
                    )}
                    <span className={`text-sm ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      {crumb}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 animate-slideInRight">
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 animate-slideInRight" style={{animationDelay: '0.1s'}}>
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 animate-slideInRight" style={{animationDelay: '0.2s'}}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;