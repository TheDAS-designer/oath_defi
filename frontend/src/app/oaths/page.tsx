'use client';

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import OathCard from '@/components/OathCard';
import OathFilters from '@/components/OathFilters';
import { mockOaths } from '@/lib/mockData';
import { OathStatus, Oath } from '@/types/oath';

interface FilterOptions {
  status: OathStatus | 'All';
  category: string;
  sortBy: 'collateral' | 'apy' | 'endTime' | 'created';
  sortOrder: 'asc' | 'desc';
  minCollateral: number;
  maxCollateral: number;
}

export default function OathsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'All',
    category: 'All Categories',
    sortBy: 'collateral',
    sortOrder: 'desc',
    minCollateral: 0,
    maxCollateral: 0
  });

  // Filter and sort oaths based on current filters
  const filteredOaths = useMemo(() => {
    let filtered = mockOaths.filter((oath) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          oath.content.toLowerCase().includes(searchLower) ||
          oath.category.toLowerCase().includes(searchLower) ||
          oath.creator.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'All' && oath.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'All Categories' && oath.category !== filters.category) {
        return false;
      }

      // Collateral filter
      const totalCollateral = oath.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
      if (filters.minCollateral > 0 && totalCollateral < filters.minCollateral) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (filters.sortBy) {
        case 'collateral':
          aValue = a.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
          bValue = b.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
          break;
        case 'apy':
          aValue = a.targetAPY || 0;
          bValue = b.targetAPY || 0;
          break;
        case 'endTime':
          aValue = a.endTime;
          bValue = b.endTime;
          break;
        case 'created':
          aValue = a.startTime;
          bValue = b.startTime;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      const result = filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      return result;
    });

    return filtered;
  }, [mockOaths, searchTerm, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Oath Marketplace
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Discover and evaluate on-chain commitments from DeFi vault managers. 
                Filter by collateral value, APY promises, and track record.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-4">
              <Link 
                href="/create" 
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Oath</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search oaths, creators, categories..."
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OathFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={mockOaths.length}
        filteredCount={filteredOaths.length}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredOaths.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No oaths found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters to find more results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    status: 'All',
                    category: 'All Categories',
                    sortBy: 'collateral',
                    sortOrder: 'desc',
                    minCollateral: 0,
                    maxCollateral: 0
                  });
                }}
                className="btn-secondary"
              >
                Clear All Filters
              </button>
              <Link href="/create" className="btn-primary">
                Create First Oath
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOaths.map((oath) => (
              <OathCard key={oath.id} oath={oath} />
            ))}
          </div>
        )}

        {/* Load More (for future pagination) */}
        {filteredOaths.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              Showing {filteredOaths.length} of {mockOaths.length} total oaths
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 