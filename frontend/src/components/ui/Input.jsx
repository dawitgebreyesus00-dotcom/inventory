import React from 'react';
import { AlertCircle } from 'lucide-react';

const Input = ({ 
  label, 
  error, 
  icon, 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300';
  const iconClasses = icon ? 'pl-10' : '';

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(icon, { 
              size: 16, 
              className: 'text-gray-400' 
            })}
          </div>
        )}
        
        <input
          className={`
            ${baseClasses}
            ${errorClasses}
            ${iconClasses}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600 animate-slideIn">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;