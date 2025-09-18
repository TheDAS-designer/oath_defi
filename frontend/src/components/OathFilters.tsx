'use client';

import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { OathStatus } from '@/types/oath';

interface FilterOptions {
  status: OathStatus | 'All';
  category: string;
  sortBy: 'collateral' | 'apy' | 'endTime' | 'created';
  sortOrder: 'asc' | 'desc';
  minCollateral: number;
  maxCollateral: number;
}

interface OathFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const OathFilters: React.FC<OathFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    'All Categories',
    'APY Guarantee',
    'TVL Growth',
    'Risk Management',
    'Token Lock',
    'High Yield'
  ];

  const sortOptions = [
    { value: 'collateral', label: 'Collateral Value' },
    { value: 'apy', label: 'Target APY' },
    { value: 'endTime', label: 'End Time' },
    { value: 'created', label: 'Recently Created' }
  ];

  const statusOptions = [
    { value: 'All', label: 'All Status', color: 'text-gray-600' },
    { value: OathStatus.Active, label: 'Active', color: 'text-primary-600' },
    { value: OathStatus.Completed, label: 'Completed', color: 'text-success-600' },
    { value: OathStatus.Failed, label: 'Failed', color: 'text-danger-600' },
    { value: OathStatus.Disputed, label: 'Disputed', color: 'text-yellow-600' }
  ];

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredCount} of {totalCount} oaths
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Desktop Stats */}
        <div className="hidden md:block text-sm text-gray-600 mb-4">
          Showing {filteredCount} of {totalCount} oaths
        </div>

        {/* Filters */}
        <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${isOpen ? 'block' : 'hidden md:grid'}`}>
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="input text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="input text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="input text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value)}
              className="input text-sm"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>

          {/* Min Collateral */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Collateral ($)
            </label>
            <input
              type="number"
              value={filters.minCollateral}
              onChange={(e) => updateFilter('minCollateral', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.status !== 'All' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Status: {filters.status}
              <button
                onClick={() => updateFilter('status', 'All')}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.category !== 'All Categories' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              {filters.category}
              <button
                onClick={() => updateFilter('category', 'All Categories')}
                className="ml-1 text-success-600 hover:text-success-800"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.minCollateral > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
              Min: ${filters.minCollateral.toLocaleString()}
              <button
                onClick={() => updateFilter('minCollateral', 0)}
                className="ml-1 text-gold-600 hover:text-gold-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OathFilters; 