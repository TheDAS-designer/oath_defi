'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Settings, Users, Activity, Shield, Clock, DollarSign, ExternalLink, Plus, Minus, RotateCcw, AlertTriangle } from 'lucide-react';
import { mockDetailedVaults } from '@/lib/vaultMockData';
import { formatCurrency, formatPercentage, formatDateTime, formatAddress } from '@/utils/format';
import PerformanceChart from '@/components/PerformanceChart';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

export default function VaultDetailPage() {
  const params = useParams();
  const vaultAddress = params.address as string;
  const { isConnected, wallet } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'activity' | 'manage'>('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const vault = mockDetailedVaults.find(v => v.address === vaultAddress);

  if (!vault) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vault Not Found</h1>
          <p className="text-gray-600 mb-6">The vault you're looking for doesn't exist.</p>
          <Link href="/vaults" className="btn-primary">
            Back to Vaults
          </Link>
        </div>
      </div>
    );
  }

  const isVaultOwner = wallet?.address === vault.creator;
  const userInvestment = 50000; // Mock user investment in USDC
  const userShare = vault.metrics.totalValueLocked > 0 ? (userInvestment / vault.metrics.totalValueLocked) * 100 : 0;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'positions', name: 'Positions', icon: DollarSign },
    { id: 'activity', name: 'Activity', icon: Activity },
    ...(isVaultOwner ? [{ id: 'manage', name: 'Manage', icon: Settings }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/vaults" 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vault.name}</h1>
              <p className="text-gray-600">{vault.symbol}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-500">Total Value Locked</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(vault.metrics.totalValueLocked)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Current APY</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(vault.metrics.apy)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Net APY</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(vault.metrics.netAPY)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Utilization</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(vault.metrics.utilization)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Deposit</span>
            </button>
            
            {userInvestment > 0 && (
              <button className="btn-secondary flex items-center space-x-2">
                <Minus className="h-4 w-4" />
                <span>Withdraw</span>
              </button>
            )}
            
            {vault.hasOath && (
              <Link 
                href={`/oaths/${vault.oathId}`}
                className="btn-secondary flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>View Oath</span>
              </Link>
            )}
            
            {!vault.hasOath && isConnected && (
              <Link 
                href={`/create?vault=${vault.address}`}
                className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
              >
                <span>Create Oath</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* User Position */}
          {userInvestment > 0 && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-medium text-primary-900 mb-2">Your Position</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-primary-700">Investment:</span>
                  <div className="font-medium text-primary-900">{formatCurrency(userInvestment)}</div>
                </div>
                <div>
                  <span className="text-primary-700">Pool Share:</span>
                  <div className="font-medium text-primary-900">
                    {userShare.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Performance Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance History</h3>
              <PerformanceChart 
                data={vault.metrics.performanceHistory}
                title="Performance History"
                metric="apy"
              />
            </div>

            {/* Vault Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vault Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strategy:</span>
                    <span className="font-medium">{vault.strategy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vault.strategy.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                      vault.strategy.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vault.strategy.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Curator:</span>
                    <span className="font-medium">{formatAddress(vault.creator)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDateTime(vault.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timelock:</span>
                    <span className="font-medium">{vault.timelock} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Management Fee:</span>
                    <span className="font-medium">{vault.feeRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance Fee:</span>
                    <span className="font-medium">{vault.performanceFee}%</span>
                  </div>
                </div>
              </div>

              {/* Strategy Details */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Details</h3>
                <p className="text-gray-600 mb-4">{vault.description}</p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Key Features:</h4>
                  {vault.strategy.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Positions</h3>
              
              <div className="space-y-4">
                {vault.positions.map((position) => (
                  <div key={position.marketAddress} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{position.marketName}</h4>
                        <p className="text-sm text-gray-600">
                          Allocation: {position.allocation.toFixed(1)}% of vault
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatPercentage(position.apy)}
                        </div>
                        <div className="text-xs text-gray-500">Current APY</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Supplied:</span>
                        <div className="font-medium">{formatCurrency(position.supplied)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Borrowed:</span>
                        <div className="font-medium">{formatCurrency(position.borrowed)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Collateral:</span>
                        <div className="font-medium">{formatCurrency(position.collateralValue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Utilization:</span>
                        <div className="font-medium">{formatPercentage(position.utilization)}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar for allocation */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Allocation</span>
                        <span>{position.allocation.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(position.allocation, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            
            <div className="space-y-4">
              {vault.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'deposit' ? 'bg-green-100' :
                    activity.type === 'withdraw' ? 'bg-red-100' :
                    activity.type === 'rebalance' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'deposit' && <Plus className="h-4 w-4 text-green-600" />}
                    {activity.type === 'withdraw' && <Minus className="h-4 w-4 text-red-600" />}
                    {activity.type === 'rebalance' && <RotateCcw className="h-4 w-4 text-blue-600" />}
                    {!['deposit', 'withdraw', 'rebalance'].includes(activity.type) && (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{activity.details}</p>
                        <p className="text-sm text-gray-600">
                          by {formatAddress(activity.user)} • {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                      
                      {activity.amount && (
                        <div className="text-right">
                          <div className={`font-medium ${
                            activity.type === 'deposit' ? 'text-green-600' :
                            activity.type === 'withdraw' ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {activity.type === 'deposit' ? '+' : activity.type === 'withdraw' ? '-' : ''}
                            {formatCurrency(activity.amount)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <a 
                        href={`https://explorer.aptoslabs.com/txn/${activity.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-xs flex items-center space-x-1"
                      >
                        <span>View transaction</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage Tab (only for vault owner) */}
        {activeTab === 'manage' && isVaultOwner && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vault Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <Plus className="h-6 w-6 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Add Market</h4>
                  <p className="text-sm text-gray-600">Add new lending market to vault</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <RotateCcw className="h-6 w-6 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Rebalance</h4>
                  <p className="text-sm text-gray-600">Adjust market allocations</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <Settings className="h-6 w-6 text-gray-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Update Fees</h4>
                  <p className="text-sm text-gray-600">Modify fee structure</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <Shield className="h-6 w-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Guardian Settings</h4>
                  <p className="text-sm text-gray-600">Update guardian configuration</p>
                </button>
                
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <Clock className="h-6 w-6 text-orange-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Timelock</h4>
                  <p className="text-sm text-gray-600">Modify timelock period</p>
                </button>
                
                <button className="p-4 border border-red-300 rounded-lg hover:bg-red-50 text-left">
                  <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
                  <h4 className="font-medium text-red-900">Emergency Pause</h4>
                  <p className="text-sm text-red-600">Pause vault operations</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit to Vault</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Current Pool Size: {formatCurrency(vault.metrics.totalValueLocked)}</p>
                <p>Your Share: {depositAmount ? ((parseFloat(depositAmount) / (vault.metrics.totalValueLocked + parseFloat(depositAmount))) * 100).toFixed(2) : '0.00'}%</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => setShowDepositModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle deposit logic here
                  setShowDepositModal(false);
                  setDepositAmount('');
                }}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 