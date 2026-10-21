import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  fullScreen = false 
}) => {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const Spinner = () => (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 size={sizes[size]} className="animate-spin text-blue-600" />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Spinner />
    </div>
  );
};

export default LoadingSpinner;