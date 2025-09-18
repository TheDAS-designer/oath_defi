import Link from 'next/link';
import { Shield, TrendingUp, Users, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { MetaMorphoVault } from '@/types/oath';
import { formatCurrency, formatPercentage, formatAddress } from '@/utils/format';

interface VaultCardProps {
  vault: MetaMorphoVault;
  showOathStatus?: boolean;
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, showOathStatus = true }) => {
  const utilization = (vault.totalShares / vault.totalAssets) * 100;
  const hasPerformanceData = vault.performanceHistory.length > 1;
  
  // Calculate trend from performance history
  const getTrend = () => {
    if (!hasPerformanceData) return null;
    
    const recent = vault.performanceHistory.slice(-2);
    const change = recent[1].apy - recent[0].apy;
    const changePercent = (change / recent[0].apy) * 100;
    
    return {
      value: Math.abs(changePercent),
      isPositive: change > 0
    };
  };

  const trend = getTrend();

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 group">
      {/* Header - Clickable area */}
      <Link href={`/vaults/${vault.address}`} className="block cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {vault.name}
              </h3>
              
              {showOathStatus && vault.hasOath && (
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-success-600" />
                  <span className="badge text-success-600 bg-success-50">
                    Oath Secured
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {vault.symbol} • Created by {formatAddress(vault.creator)}
            </p>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-gray-500">
                <Users className="h-3 w-3" />
                <span>{(vault.totalShares / 1000000).toFixed(1)}M shares</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(vault.currentAPY)}
            </div>
            <div className="text-xs text-gray-500">Current APY</div>
            
            {trend && (
              <div className="flex items-center justify-end mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600 rotate-180'
                }`} />
                <span className={`text-xs ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {trend.isPositive ? '+' : '-'}{trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TVL and Utilization */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total Value Locked</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(vault.totalAssets)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Utilization</div>
            <div className="font-semibold text-gray-900">
              {utilization.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        {hasPerformanceData && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">30-day Performance</span>
              <span className="text-gray-900">Stable</span>
            </div>
            
            {/* Mini performance chart */}
            <div className="flex items-end space-x-1 h-8">
              {vault.performanceHistory.slice(-7).map((data, index) => {
                const height = (data.apy / Math.max(...vault.performanceHistory.map(d => d.apy))) * 100;
                return (
                  <div
                    key={index}
                    className="bg-primary-200 rounded-sm flex-1 transition-all duration-200 group-hover:bg-primary-300"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Oath Status */}
        {showOathStatus && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            {vault.hasOath ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span className="text-sm text-success-700 font-medium">Protected by Oath</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">No active oath</span>
              </div>
            )}
            
            <span className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1">
              <span>View Details</span>
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        )}
      </Link>

      {/* Action Buttons - Outside of Link to avoid nesting */}
      <div className="mt-4 flex space-x-2">
        <button className="btn-primary flex-1 text-sm py-2">
          Invest
        </button>
        
        {!vault.hasOath && (
          <Link 
            href={`/create?vault=${vault.address}`}
            className="btn-secondary flex-1 text-sm py-2 text-center"
          >
            Create Oath
          </Link>
        )}
      </div>
    </div>
  );
};

export default VaultCard; 