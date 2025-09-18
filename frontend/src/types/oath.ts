export enum OathStatus {
  Active = 'Active',
  Completed = 'Completed', 
  Failed = 'Failed',
  Disputed = 'Disputed'
}

export interface Oath {
  id: string;
  creator: string;
  content: string;
  category: string;
  stableCollateral: number;
  startTime: number;
  endTime: number;
  status: OathStatus;
  referencedNFTs: string[];
  evidence: string;
  isOverCollateralized: boolean;
  // 扩展字段
  targetAPY?: number;
  currentAPY?: number;
  vaultAddress?: string;
  collateralTokens: CollateralToken[];
  slashingInfo?: SlashingInfo;
  compensationInfo?: CompensationInfo;
}

export interface CollateralToken {
  symbol: string;
  amount: number;
  address: string;
  usdValue: number;
}

export interface SlashingInfo {
  slashedAmount: number;
  slashingReason: string;
  slashingTime: number;
  arbitratorAddress: string;
  arbitratorFee: number;
  protocolFee: number;
}

export interface CompensationInfo {
  totalCompensationPool: number;
  eligibleUsers: CompensationUser[];
  distributedAmount: number;
  pendingAmount: number;
}

export interface CompensationUser {
  address: string;
  eligibleAmount: number;
  claimed: boolean;
  claimTime?: number;
}

export interface MetaMorphoVault {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  totalAssets: number;
  totalShares: number;
  currentAPY: number;
  performanceHistory: PerformanceData[];
  hasOath: boolean;
  oathId?: string;
}

export interface PerformanceData {
  timestamp: number;
  apy: number;
  tvl: number;
}

export interface OathTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: TemplateParameter[];
  minimumCollateral: number;
}

export interface TemplateParameter {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date';
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
} 