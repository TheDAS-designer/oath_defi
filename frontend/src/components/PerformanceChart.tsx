'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatPercentage, formatDate } from '@/utils/format';

interface PerformanceData {
  timestamp: number;
  apy: number;
  tvl: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  targetAPY?: number;
  title?: string;
  metric?: 'apy' | 'tvl';
  showTVL?: boolean; // 兼容旧的接口
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  targetAPY, 
  title = 'Performance History', 
  metric,
  showTVL = false
}) => {
  // 确定实际使用的 metric，兼容旧接口
  const actualMetric = metric || (showTVL ? 'tvl' : 'apy');
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No performance data available
        </div>
      </div>
    );
  }

  const formatTooltipValue = (value: number) => {
    if (actualMetric === 'apy') {
      return formatPercentage(value);
    }
    return `$${value.toLocaleString()}`;
  };

  const formatYAxisValue = (value: number) => {
    if (actualMetric === 'apy') {
      return `${value}%`;
    }
    return value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}K`;
  };

  const currentValue = data[data.length - 1]?.[actualMetric] || 0;
  const isAboveTarget = targetAPY ? currentValue >= targetAPY : true;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            metric === 'apy' && targetAPY 
              ? (isAboveTarget ? 'text-success-600' : 'text-danger-600')
              : 'text-gray-900'
          }`}>
            {formatTooltipValue(currentValue)}
          </div>
          <div className="text-sm text-gray-500">Current</div>
          {targetAPY && metric === 'apy' && (
            <div className="text-xs text-gray-400 mt-1">
              Target: {formatPercentage(targetAPY)}
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(timestamp) => formatDate(timestamp)}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip
              labelFormatter={(timestamp) => formatDate(timestamp as number)}
              formatter={(value: number) => [formatTooltipValue(value), actualMetric.toUpperCase()]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            
            {/* Target line for APY charts */}
            {targetAPY && metric === 'apy' && (
              <ReferenceLine 
                y={targetAPY} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: `Target: ${formatPercentage(targetAPY)}`, position: 'top' }}
              />
            )}
            
            <Line
              type="monotone"
              dataKey={actualMetric}
              stroke={actualMetric === 'apy' && targetAPY && !isAboveTarget ? '#ef4444' : '#0ea5e9'}
              strokeWidth={3}
              dot={{ fill: actualMetric === 'apy' && targetAPY && !isAboveTarget ? '#ef4444' : '#0ea5e9', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      {data.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Peak</div>
              <div className="font-semibold text-gray-900">
                {formatTooltipValue(Math.max(...data.map(d => d[actualMetric])))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Low</div>
              <div className="font-semibold text-gray-900">
                {formatTooltipValue(Math.min(...data.map(d => d[actualMetric])))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Average</div>
              <div className="font-semibold text-gray-900">
                {formatTooltipValue(data.reduce((sum, d) => sum + d[actualMetric], 0) / data.length)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceChart; 