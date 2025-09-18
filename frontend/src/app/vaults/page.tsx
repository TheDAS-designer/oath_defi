'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import VaultCard from '@/components/VaultCard';
import { mockMetaMorphoVaults } from '@/lib/mockData';

interface VaultFilters {
  hasOath: 'all' | 'protected' | 'unprotected';
  minAPY: number;
  minTVL: number;
  sortBy: 'apy' | 'tvl' | 'created';
  sortOrder: 'asc' | 'desc';
}

export default function VaultsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<VaultFilters>({
    hasOath: 'all',
    minAPY: 0,
    minTVL: 0,
    sortBy: 'tvl',
    sortOrder: 'desc'
  });

  const filteredVaults = useMemo(() => {
    let filtered = mockMetaMorphoVaults.filter((vault) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          vault.name.toLowerCase().includes(searchLower) ||
          vault.symbol.toLowerCase().includes(searchLower) ||
          vault.creator.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Oath filter
      if (filters.hasOath === 'protected' && !vault.hasOath) return false;
      if (filters.hasOath === 'unprotected' && vault.hasOath) return false;

      // APY filter
      if (filters.minAPY > 0 && vault.currentAPY < filters.minAPY) return false;

      // TVL filter
      if (filters.minTVL > 0 && vault.totalAssets < filters.minTVL) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (filters.sortBy) {
        case 'apy':
          aValue = a.currentAPY;
          bValue = b.currentAPY;
          break;
        case 'tvl':
          aValue = a.totalAssets;
          bValue = b.totalAssets;
          break;
        case 'created':
          // Since we don't have creation date, use performance history start
          aValue = a.performanceHistory[0]?.timestamp || 0;
          bValue = b.performanceHistory[0]?.timestamp || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [mockMetaMorphoVaults, searchTerm, filters]);

  const updateFilter = (key: keyof VaultFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const protectedVaults = mockMetaMorphoVaults.filter(v => v.hasOath).length;
  const totalTVL = mockMetaMorphoVaults.reduce((sum, v) => sum + v.totalAssets, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Vault Marketplace
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Discover high-yield MetaMorpho vaults on Aptos. Invest in protected vaults 
                with OATH commitments or create your own vault strategy.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
              <Link 
                href="/create" 
                className="btn-secondary flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>Create Oath</span>
              </Link>
              
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Vault</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">Protected Vaults</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-primary-900">
                {protectedVaults}/{mockMetaMorphoVaults.length}
              </div>
            </div>
            
            <div className="bg-success-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-success-600" />
                <span className="text-sm font-medium text-success-900">Total TVL</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-success-900">
                ${(totalTVL / 1000000).toFixed(1)}M
              </div>
            </div>
            
            <div className="bg-gold-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-gold-600" />
                <span className="text-sm font-medium text-gold-900">Avg APY</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-gold-900">
                {(mockMetaMorphoVaults.reduce((sum, v) => sum + v.currentAPY, 0) / mockMetaMorphoVaults.length).toFixed(1)}%
              </div>
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
                placeholder="Search vaults, symbols, creators..."
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protection Status
              </label>
              <select
                value={filters.hasOath}
                onChange={(e) => updateFilter('hasOath', e.target.value)}
                className="input text-sm"
              >
                <option value="all">All Vaults</option>
                <option value="protected">Protected by Oath</option>
                <option value="unprotected">No Oath</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min APY (%)
              </label>
              <input
                type="number"
                value={filters.minAPY}
                onChange={(e) => updateFilter('minAPY', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input text-sm"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min TVL ($)
              </label>
              <input
                type="number"
                value={filters.minTVL}
                onChange={(e) => updateFilter('minTVL', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="input text-sm"
              >
                <option value="tvl">Total Value Locked</option>
                <option value="apy">APY</option>
                <option value="created">Recently Created</option>
              </select>
            </div>

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
          </div>

          {/* Active filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.hasOath !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {filters.hasOath === 'protected' ? 'Protected by Oath' : 'No Oath'}
                <button
                  onClick={() => updateFilter('hasOath', 'all')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.minAPY > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Min APY: {filters.minAPY}%
                <button
                  onClick={() => updateFilter('minAPY', 0)}
                  className="ml-1 text-success-600 hover:text-success-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.minTVL > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                Min TVL: ${filters.minTVL.toLocaleString()}
                <button
                  onClick={() => updateFilter('minTVL', 0)}
                  className="ml-1 text-gold-600 hover:text-gold-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-sm text-gray-600">
          Showing {filteredVaults.length} of {mockMetaMorphoVaults.length} vaults
        </div>

        {filteredVaults.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No vaults found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  hasOath: 'all',
                  minAPY: 0,
                  minTVL: 0,
                  sortBy: 'tvl',
                  sortOrder: 'desc'
                });
              }}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVaults.map((vault) => (
              <VaultCard key={vault.address} vault={vault} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 