'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Shield, Clock, Users, AlertTriangle, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useOathData } from '@/hooks/useOathData';
import { mockMetaMorphoVaults } from '@/lib/mockData';
import { OathStatus } from '@/types/oath';
import { formatCurrency, formatPercentage, formatDateTime, formatAddress, getStatusColor, calculateProgress } from '@/utils/format';
import PerformanceChart from '@/components/PerformanceChart';
import { useClientTime } from '@/hooks/useClientTime';

export default function OathDetailPage() {
  const params = useParams();
  const oathId = params.id as string;
  const currentTime = useClientTime();
  const { getOathById, hasRealData } = useOathData();

  const oath = getOathById(oathId);
  const vault = oath?.vaultAddress ? mockMetaMorphoVaults.find(v => v.address === oath.vaultAddress) : null;

  if (!oath) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oath Not Found</h1>
          <p className="text-gray-600 mb-6">The oath you're looking for doesn't exist.</p>
          <Link href="/oaths" className="btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(oath.startTime, oath.endTime, currentTime);
  const totalCollateralValue = oath.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);
  const isActive = oath.status === OathStatus.Active;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/oaths" 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Oath Details</h1>
            {hasRealData && (oath?.id.startsWith('real_') || oath?.id.startsWith('geomi_')) && (
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                Live Data
              </span>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`badge ${getStatusColor(oath.status)}`}>
                  {oath.status === OathStatus.Active && <Clock className="h-4 w-4 mr-1" />}
                  {oath.status === OathStatus.Completed && <CheckCircle className="h-4 w-4 mr-1" />}
                  {oath.status === OathStatus.Failed && <XCircle className="h-4 w-4 mr-1" />}
                  {oath.status === OathStatus.Disputed && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {oath.status}
                </span>
                
                {oath.isOverCollateralized && (
                  <span className="badge text-gold-600 bg-gold-50">
                    <Shield className="h-3 w-3 mr-1" />
                    Over-collateralized
                  </span>
                )}
                
                <span className="badge text-gray-600 bg-gray-100">
                  {oath.category}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {oath.content}
              </h2>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>Created by</span>
                  <button
                    onClick={() => copyToClipboard(oath.creator)}
                    className="font-medium text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                  >
                    <span>{formatAddress(oath.creator)}</span>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div>•</div>
                <div>Started {formatDateTime(oath.startTime)}</div>
                <div>•</div>
                <div>Ends {formatDateTime(oath.endTime)}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalCollateralValue)}
              </div>
              <div className="text-sm text-gray-500">Total Collateral</div>
            </div>
          </div>

          {/* Progress Bar for Active Oaths */}
          {isActive && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
                             <div className="mt-2 text-sm text-gray-600">
                 {currentTime ? Math.ceil((oath.endTime - currentTime) / (1000 * 60 * 60 * 24)) : '...'} days remaining
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Monitoring */}
            {vault && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Real-time Performance Monitoring
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <PerformanceChart
                    data={vault.performanceHistory}
                    targetAPY={oath.targetAPY}
                    title="APY Performance"
                    metric="apy"
                  />
                  <PerformanceChart
                    data={vault.performanceHistory}
                    title="TVL Growth"
                    metric="tvl"
                  />
                </div>
              </div>
            )}

            {/* Collateral Breakdown */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Collateral Breakdown
              </h3>
              <div className="space-y-4">
                {oath.collateralTokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-600">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{token.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {token.amount.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(token.usdValue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((token.usdValue / totalCollateralValue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence & Notes */}
            {oath.evidence && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evidence & Notes
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {oath.evidence}
                </p>
              </div>
            )}

            {/* Compensation Information for Failed Oaths */}
            {oath.status === OathStatus.Failed && oath.compensationInfo && (
              <div className="card border-danger-200">
                <h3 className="text-lg font-semibold text-danger-800 mb-4 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  Compensation Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-danger-50 rounded-lg">
                    <div className="text-2xl font-bold text-danger-600">
                      {formatCurrency(oath.compensationInfo.totalCompensationPool)}
                    </div>
                    <div className="text-sm text-danger-700">Total Pool</div>
                  </div>
                  <div className="text-center p-4 bg-success-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">
                      {formatCurrency(oath.compensationInfo.distributedAmount)}
                    </div>
                    <div className="text-sm text-success-700">Distributed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(oath.compensationInfo.pendingAmount)}
                    </div>
                    <div className="text-sm text-yellow-700">Pending</div>
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-3">Eligible Users</h4>
                <div className="space-y-2">
                  {oath.compensationInfo.eligibleUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm text-gray-600">
                          {formatAddress(user.address)}
                        </span>
                        <span className={`badge ${user.claimed ? 'text-success-600 bg-success-50' : 'text-yellow-600 bg-yellow-50'}`}>
                          {user.claimed ? 'Claimed' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(user.eligibleAmount)}
                        </div>
                        {user.claimed && user.claimTime && (
                          <div className="text-xs text-gray-500">
                            {formatDateTime(user.claimTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                {oath.targetAPY && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target APY</span>
                    <span className="font-semibold text-gray-900">
                      {formatPercentage(oath.targetAPY)}
                    </span>
                  </div>
                )}
                
                {oath.currentAPY && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current APY</span>
                    <span className={`font-semibold ${
                      oath.targetAPY && oath.currentAPY >= oath.targetAPY 
                        ? 'text-success-600' 
                        : 'text-danger-600'
                    }`}>
                      {formatPercentage(oath.currentAPY)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {Math.ceil((oath.endTime - oath.startTime) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Oath ID</span>
                  <span className="font-mono text-sm text-gray-900">#{oath.id}</span>
                </div>
              </div>
            </div>

            {/* Related Vault */}
            {vault && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Related Vault
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">{vault.name}</div>
                    <div className="text-sm text-gray-500">{vault.symbol}</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current APY</span>
                    <span className="font-semibold text-gray-900">
                      {formatPercentage(vault.currentAPY)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(vault.totalAssets)}
                    </span>
                  </div>
                  
                  <Link 
                    href={`/vaults/${vault.address}`}
                    className="btn-primary w-full flex items-center justify-center space-x-2 mt-4"
                  >
                    <span>View Vault</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Follow Oath</span>
                </button>
                
                <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>View on Explorer</span>
                </button>
                
                {oath.status === OathStatus.Failed && oath.compensationInfo && (
                  <button className="btn-primary w-full">
                    Check Compensation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 