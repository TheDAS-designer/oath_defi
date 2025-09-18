import Link from 'next/link';
import { Shield, Clock, Coins, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Oath, OathStatus } from '@/types/oath';
import { formatCurrency, formatPercentage, formatTimeRemaining, formatAddress, getStatusColor, calculateProgress } from '@/utils/format';
import { useClientTime } from '@/hooks/useClientTime';

interface OathCardProps {
  oath: Oath;
  showFullDetails?: boolean;
}

const OathCard: React.FC<OathCardProps> = ({ oath, showFullDetails = false }) => {
  const currentTime = useClientTime();
  const progress = calculateProgress(oath.startTime, oath.endTime, currentTime);
  const isActive = oath.status === OathStatus.Active;
  const totalCollateralValue = oath.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0);

  const getStatusIcon = () => {
    switch (oath.status) {
      case OathStatus.Active:
        return <Clock className="h-4 w-4" />;
      case OathStatus.Completed:
        return <CheckCircle className="h-4 w-4" />;
      case OathStatus.Failed:
        return <XCircle className="h-4 w-4" />;
      case OathStatus.Disputed:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 group cursor-pointer">
      <Link href={`/oaths/${oath.id}`} className="block">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`badge ${getStatusColor(oath.status)}`}>
                {getStatusIcon()}
                <span className="ml-1">{oath.status}</span>
              </span>
              {oath.isOverCollateralized && (
                <span className="badge text-gold-600 bg-gold-50">
                  <Shield className="h-3 w-3 mr-1" />
                  Over-collateralized
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {oath.content}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Created by {formatAddress(oath.creator)}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(totalCollateralValue)}
            </div>
            <div className="text-xs text-gray-500">Total Collateral</div>
          </div>
        </div>

        {/* APY Information */}
        {oath.targetAPY && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Target APY</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatPercentage(oath.targetAPY)}
                </div>
                <div className="text-xs text-gray-500">Promised</div>
              </div>
              {oath.currentAPY && (
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    oath.currentAPY >= oath.targetAPY ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {formatPercentage(oath.currentAPY)}
                  </div>
                  <div className="text-xs text-gray-500">Current</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collateral Breakdown */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Collateral</h4>
          <div className="space-y-2">
            {oath.collateralTokens.map((token, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Coins className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{token.symbol}</span>
                  <span className="text-gray-500">{token.amount.toLocaleString()}</span>
                </div>
                <span className="text-gray-900">{formatCurrency(token.usdValue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress and Time */}
        {isActive && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {formatTimeRemaining(oath.endTime, currentTime)} remaining
            </div>
          </div>
        )}

        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{oath.category}</span>
          {oath.vaultAddress && (
            <span className="text-xs text-primary-600 hover:text-primary-700">
              View Vault →
            </span>
          )}
        </div>

        {/* Failed Oath Additional Info */}
        {oath.status === OathStatus.Failed && oath.slashingInfo && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-4 w-4 text-danger-600" />
              <span className="text-sm font-medium text-danger-800">Oath Failed</span>
            </div>
            <div className="text-sm text-danger-700">
              Slashed: {formatCurrency(oath.slashingInfo.slashedAmount)}
            </div>
            {oath.compensationInfo && (
              <div className="text-xs text-danger-600 mt-1">
                {oath.compensationInfo.eligibleUsers.length} users eligible for compensation
              </div>
            )}
          </div>
        )}
      </Link>
    </div>
  );
};

export default OathCard; 