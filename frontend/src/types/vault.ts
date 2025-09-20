import { PerformanceData } from './oath';

export interface VaultStrategy {
  id: string;
  name: string;
  description: string;
  category: 'Conservative' | 'Balanced' | 'Aggressive' | 'Yield Farming' | 'Arbitrage';
  expectedAPY: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  minimumDeposit: number;
  lockPeriod?: number; // days
  features: string[];
}

export interface Market {
  address: string;
  name: string;
  collateralToken: string;
  borrowToken: string;
  lltv: number; // Loan-to-Value ratio
  utilizationRate: number;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: number;
  totalBorrow: number;
  isActive: boolean;
}

export interface VaultConfiguration {
  name: string;
  symbol: string;
  description: string;
  strategy: string;
  curator: string;
  timelock: number; // days
  guardian?: string;
  feeRate: number; // percentage
  performanceFee: number; // percentage
  markets: string[]; // market addresses
  allocations: { [marketAddress: string]: number }; // percentage allocation
}

export interface CreateVaultForm {
  // Basic Info
  name: string;
  symbol: string;
  description: string;
  
  // Strategy
  strategyId: string;
  customStrategy?: string;
  
  // Configuration
  timelock: number;
  feeRate: number;
  performanceFee: number;
  initialDeposit: number;
  
  // Markets
  selectedMarkets: Market[];
  allocations: { [marketAddress: string]: number };
  
  // Governance
  guardianType: 'none' | 'multisig' | 'aragon' | 'custom';
  guardianConfig?: any;
  
  // Terms
  acceptedTerms: boolean;
  acceptedRisks: boolean;
}

export interface VaultMetrics {
  totalValueLocked: number;
  apy: number;
  utilization: number;
  totalSupplied: number;
  totalBorrowed: number;
  netAPY: number;
  performanceHistory: PerformanceData[];
}

export interface VaultPosition {
  marketAddress: string;
  marketName: string;
  supplied: number;
  borrowed: number;
  collateralValue: number;
  utilization: number;
  apy: number;
  allocation: number; // percentage of vault
}

export interface VaultActivity {
  id: string;
  type: 'deposit' | 'withdraw' | 'rebalance' | 'market_add' | 'market_remove' | 'fee_update' | 'guardian_update';
  timestamp: number;
  user: string;
  amount?: number;
  details: string;
  txHash: string;
}

export interface DetailedVault {
  // Basic info
  address: string;
  name: string;
  symbol: string;
  description: string;
  creator: string;
  createdAt: number;
  
  // Strategy
  strategy: VaultStrategy;
  
  // Configuration
  timelock: number;
  feeRate: number;
  performanceFee: number;
  guardian?: string;
  guardianType: string;
  
  // Metrics
  metrics: VaultMetrics;
  
  // Markets & Positions
  positions: VaultPosition[];
  
  // Activity
  recentActivity: VaultActivity[];
  
  // Oath info
  hasOath: boolean;
  oathId?: string;
  
  // Status
  isActive: boolean;
  isPaused: boolean;
  isEmergency: boolean;
} 