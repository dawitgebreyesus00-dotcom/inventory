import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

const FilterBar = ({ 
  searchValue, 
  onSearchChange, 
  filters = [], 
  onFilterChange,
  onClearFilters,
  className = '' 
}) => {
  const hasActiveFilters = filters.some(filter => filter.value);

  return (
    <Card className={`animate-slideIn ${className}`} padding="md">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search />}
            className="w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 lg:flex-nowrap">
          {filters.map((filter, index) => (
            <div key={index} className="min-w-0 flex-shrink-0">
              {filter.type === 'select' ? (
                <select
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'date' ? (
                <input
                  type="date"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={filter.placeholder}
                />
              ) : (
                <Input
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                />
              )}
            </div>
          ))}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              onClick={onClearFilters}
              icon={<X />}
              className="flex-shrink-0"
            >
              Clear
            </Button>
          )}

          {/* Filter Icon */}
          <div className="flex items-center px-3 py-2 text-gray-400">
            <Filter size={16} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;