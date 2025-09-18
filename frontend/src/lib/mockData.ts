import { Oath, OathStatus, MetaMorphoVault, OathTemplate, CollateralToken } from '@/types/oath';

export const mockOaths: Oath[] = [
  {
    id: '1',
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    content: 'APY Guarantee: Minimum 12% annual yield for 30 days',
    category: 'APY Guarantee',
    stableCollateral: 100000,
    startTime: Date.now() - 86400000 * 10, // 10 days ago
    endTime: Date.now() + 86400000 * 20, // 20 days from now
    status: OathStatus.Active,
    referencedNFTs: [],
    evidence: '',
    isOverCollateralized: false,
    targetAPY: 12,
    currentAPY: 13.5,
    vaultAddress: '0xvault1234567890abcdef',
    collateralTokens: [
      { symbol: 'USDC', amount: 80000, address: '0xusdc', usdValue: 80000 },
      { symbol: 'APT', amount: 2500, address: '0xapt', usdValue: 20000 }
    ]
  },
  {
    id: '2', 
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    content: 'TVL Growth Promise: 50% increase in 90 days',
    category: 'TVL Growth',
    stableCollateral: 250000,
    startTime: Date.now() - 86400000 * 45, // 45 days ago
    endTime: Date.now() + 86400000 * 45, // 45 days from now
    status: OathStatus.Active,
    referencedNFTs: [],
    evidence: '',
    isOverCollateralized: true,
    vaultAddress: '0xvault2345678901bcdef',
    collateralTokens: [
      { symbol: 'USDC', amount: 150000, address: '0xusdc', usdValue: 150000 },
      { symbol: 'APT', amount: 12500, address: '0xapt', usdValue: 100000 }
    ]
  },
  {
    id: '3',
    creator: '0xdef1234567890abcdef1234567890abcdef1234',
    content: 'Conservative Strategy: Max 5% drawdown, 8% APY',
    category: 'Risk Management',
    stableCollateral: 50000,
    startTime: Date.now() - 86400000 * 60, // 60 days ago
    endTime: Date.now() - 86400000 * 5, // 5 days ago (completed)
    status: OathStatus.Completed,
    referencedNFTs: ['sbt_001'],
    evidence: 'Successfully maintained 8.3% APY with max 3.2% drawdown',
    isOverCollateralized: false,
    targetAPY: 8,
    currentAPY: 8.3,
    vaultAddress: '0xvault3456789012cdef',
    collateralTokens: [
      { symbol: 'USDC', amount: 40000, address: '0xusdc', usdValue: 40000 },
      { symbol: 'APT', amount: 1250, address: '0xapt', usdValue: 10000 }
    ]
  },
  {
    id: '4',
    creator: '0x567890abcdef1234567890abcdef1234567890ab',
    content: 'High Yield Strategy: 20% APY for 60 days',
    category: 'High Yield',
    stableCollateral: 75000,
    startTime: Date.now() - 86400000 * 70, // 70 days ago
    endTime: Date.now() - 86400000 * 10, // 10 days ago (failed)
    status: OathStatus.Failed,
    referencedNFTs: [],
    evidence: 'Strategy failed due to market volatility, achieved only 6.2% APY',
    isOverCollateralized: false,
    targetAPY: 20,
    currentAPY: 6.2,
    vaultAddress: '0xvault4567890123def',
    collateralTokens: [
      { symbol: 'USDC', amount: 60000, address: '0xusdc', usdValue: 60000 },
      { symbol: 'APT', amount: 1875, address: '0xapt', usdValue: 15000 }
    ],
    slashingInfo: {
      slashedAmount: 75000,
      slashingReason: 'Failed to meet promised APY threshold',
      slashingTime: Date.now() - 86400000 * 10,
      arbitratorAddress: '0xarbitrator123',
      arbitratorFee: 2250, // 3%
      protocolFee: 3750 // 5%
    },
    compensationInfo: {
      totalCompensationPool: 69000, // 75000 - 6000 (fees)
      eligibleUsers: [
        { address: '0xuser1', eligibleAmount: 15000, claimed: true, claimTime: Date.now() - 86400000 * 8 },
        { address: '0xuser2', eligibleAmount: 25000, claimed: true, claimTime: Date.now() - 86400000 * 7 },
        { address: '0xuser3', eligibleAmount: 20000, claimed: false },
        { address: '0xuser4', eligibleAmount: 9000, claimed: false }
      ],
      distributedAmount: 40000,
      pendingAmount: 29000
    }
  },
  {
    id: '5',
    creator: '0x890abcdef1234567890abcdef1234567890abcde',
    content: 'Team Token Lock: No transfers for 180 days',
    category: 'Token Lock',
    stableCollateral: 500000,
    startTime: Date.now() - 86400000 * 90, // 90 days ago
    endTime: Date.now() + 86400000 * 90, // 90 days from now
    status: OathStatus.Active,
    referencedNFTs: [],
    evidence: '',
    isOverCollateralized: true,
    collateralTokens: [
      { symbol: 'USDC', amount: 300000, address: '0xusdc', usdValue: 300000 },
      { symbol: 'APT', amount: 25000, address: '0xapt', usdValue: 200000 }
    ]
  }
];

export const mockMetaMorphoVaults: MetaMorphoVault[] = [
  {
    address: '0xvault1234567890abcdef',
    name: 'Stable Yield Strategy',
    symbol: 'SYS-VAULT',
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    totalAssets: 2500000,
    totalShares: 2400000,
    currentAPY: 13.5,
    performanceHistory: [
      { timestamp: Date.now() - 86400000 * 30, apy: 11.2, tvl: 1800000 },
      { timestamp: Date.now() - 86400000 * 25, apy: 12.1, tvl: 2000000 },
      { timestamp: Date.now() - 86400000 * 20, apy: 12.8, tvl: 2200000 },
      { timestamp: Date.now() - 86400000 * 15, apy: 13.2, tvl: 2350000 },
      { timestamp: Date.now() - 86400000 * 10, apy: 13.5, tvl: 2500000 },
      { timestamp: Date.now() - 86400000 * 5, apy: 13.8, tvl: 2480000 },
      { timestamp: Date.now(), apy: 13.5, tvl: 2500000 }
    ],
    hasOath: true,
    oathId: '1'
  },
  {
    address: '0xvault2345678901bcdef',
    name: 'Growth Focused Fund',
    symbol: 'GFF-VAULT',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    totalAssets: 5200000,
    totalShares: 4800000,
    currentAPY: 18.2,
    performanceHistory: [
      { timestamp: Date.now() - 86400000 * 30, apy: 15.5, tvl: 3500000 },
      { timestamp: Date.now() - 86400000 * 25, apy: 16.8, tvl: 4000000 },
      { timestamp: Date.now() - 86400000 * 20, apy: 17.2, tvl: 4500000 },
      { timestamp: Date.now() - 86400000 * 15, apy: 17.8, tvl: 4800000 },
      { timestamp: Date.now() - 86400000 * 10, apy: 18.5, tvl: 5000000 },
      { timestamp: Date.now() - 86400000 * 5, apy: 18.8, tvl: 5100000 },
      { timestamp: Date.now(), apy: 18.2, tvl: 5200000 }
    ],
    hasOath: true,
    oathId: '2'
  },
  {
    address: '0xvault3456789012cdef',
    name: 'Conservative Portfolio',
    symbol: 'CP-VAULT',
    creator: '0xdef1234567890abcdef1234567890abcdef1234',
    totalAssets: 1800000,
    totalShares: 1750000,
    currentAPY: 8.3,
    performanceHistory: [
      { timestamp: Date.now() - 86400000 * 60, apy: 8.0, tvl: 1200000 },
      { timestamp: Date.now() - 86400000 * 50, apy: 8.2, tvl: 1350000 },
      { timestamp: Date.now() - 86400000 * 40, apy: 8.1, tvl: 1500000 },
      { timestamp: Date.now() - 86400000 * 30, apy: 8.3, tvl: 1600000 },
      { timestamp: Date.now() - 86400000 * 20, apy: 8.4, tvl: 1700000 },
      { timestamp: Date.now() - 86400000 * 10, apy: 8.3, tvl: 1750000 },
      { timestamp: Date.now(), apy: 8.3, tvl: 1800000 }
    ],
    hasOath: true,
    oathId: '3'
  },
  {
    address: '0xvault5678901234def',
    name: 'Balanced Strategy',
    symbol: 'BS-VAULT',
    creator: '0x234567890abcdef1234567890abcdef12345678',
    totalAssets: 3200000,
    totalShares: 3100000,
    currentAPY: 14.7,
    performanceHistory: [
      { timestamp: Date.now() - 86400000 * 30, apy: 13.2, tvl: 2800000 },
      { timestamp: Date.now() - 86400000 * 25, apy: 13.8, tvl: 2900000 },
      { timestamp: Date.now() - 86400000 * 20, apy: 14.2, tvl: 3000000 },
      { timestamp: Date.now() - 86400000 * 15, apy: 14.5, tvl: 3100000 },
      { timestamp: Date.now() - 86400000 * 10, apy: 14.8, tvl: 3150000 },
      { timestamp: Date.now() - 86400000 * 5, apy: 14.9, tvl: 3180000 },
      { timestamp: Date.now(), apy: 14.7, tvl: 3200000 }
    ],
    hasOath: false
  }
];

export const mockOathTemplates: OathTemplate[] = [
  {
    id: 'apy-guarantee',
    name: 'APY Guarantee',
    description: 'Promise a minimum APY for your vault over a specific period',
    category: 'Performance',
    minimumCollateral: 10000,
    parameters: [
      { key: 'targetAPY', label: 'Minimum APY (%)', type: 'number', required: true, min: 1, max: 50 },
      { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 7, max: 365 },
      { key: 'vaultAddress', label: 'Vault Address', type: 'string', required: true }
    ]
  },
  {
    id: 'tvl-growth',
    name: 'TVL Growth Promise',
    description: 'Commit to growing your vault\'s Total Value Locked by a certain percentage',
    category: 'Growth',
    minimumCollateral: 50000,
    parameters: [
      { key: 'growthTarget', label: 'Growth Target (%)', type: 'number', required: true, min: 10, max: 200 },
      { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 30, max: 365 },
      { key: 'vaultAddress', label: 'Vault Address', type: 'string', required: true }
    ]
  },
  {
    id: 'risk-management',
    name: 'Risk Management',
    description: 'Guarantee maximum drawdown limits while maintaining minimum returns',
    category: 'Risk Control',
    minimumCollateral: 25000,
    parameters: [
      { key: 'maxDrawdown', label: 'Max Drawdown (%)', type: 'number', required: true, min: 1, max: 20 },
      { key: 'minAPY', label: 'Minimum APY (%)', type: 'number', required: true, min: 1, max: 30 },
      { key: 'duration', label: 'Duration (days)', type: 'number', required: true, min: 30, max: 180 },
      { key: 'vaultAddress', label: 'Vault Address', type: 'string', required: true }
    ]
  },
  {
    id: 'token-lock',
    name: 'Token Lock Commitment',
    description: 'Lock team tokens for a specified period to build trust (independent of any vault)',
    category: 'Trust Building',
    minimumCollateral: 100000,
    parameters: [
      { key: 'lockDuration', label: 'Lock Duration (days)', type: 'number', required: true, min: 30, max: 730 },
      { key: 'tokenAddress', label: 'Token Contract Address', type: 'string', required: true },
      { key: 'lockedAmount', label: 'Amount to Lock', type: 'number', required: true, min: 1 }
    ]
  }
];

export const protocolStats = {
  totalValueVowed: 975000, // Total collateral across all oaths
  activeOaths: 3,
  completedOaths: 1,
  failedOaths: 1,
  totalCompensationPaid: 40000
}; 