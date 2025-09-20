import { format } from 'date-fns';

export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM dd, yyyy');
};

export const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
};

export const formatTimeRemaining = (endTime: number, currentTime?: number | null): string => {
  if (!currentTime) {
    // Return a placeholder during SSR
    return '...';
  }
  
  const remaining = endTime - currentTime;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

export const formatAddress = (address: string, length: number = 4): string => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};

export const getStatusColor = (status: string | number | any): string => {
  const statusStr = typeof status === 'string' ? status : String(status || '');
  switch (statusStr.toLowerCase()) {
    case 'active':
      return 'text-primary-600 bg-primary-50';
    case 'completed':
      return 'text-success-600 bg-success-50';
    case 'failed':
      return 'text-danger-600 bg-danger-50';
    case 'disputed':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const calculateProgress = (startTime: number, endTime: number, currentTime?: number | null): number => {
  if (!currentTime) {
    return 0; // Return 0 during SSR
  }
  
  const total = endTime - startTime;
  const elapsed = currentTime - startTime;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  
  return Math.floor((elapsed / total) * 100);
}; 

export const formatTransactionHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

export const getAptosExplorerUrl = (hash: string, network: 'testnet' | 'mainnet' = 'testnet'): string => {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.aptoslabs.com'
    : 'https://explorer.aptoslabs.com/?network=testnet';
  
  return `${baseUrl}/txn/${hash}`;
};

export const getAptosAccountUrl = (address: string, network: 'testnet' | 'mainnet' = 'testnet'): string => {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.aptoslabs.com'
    : 'https://explorer.aptoslabs.com/?network=testnet';
  
  return `${baseUrl}/account/${address}`;
}; 