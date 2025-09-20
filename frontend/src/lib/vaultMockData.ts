import { VaultStrategy, Market, DetailedVault, VaultActivity } from '@/types/vault';

export const mockVaultStrategies: VaultStrategy[] = [
  {
    id: 'stable-yield',
    name: 'Stable Yield',
    description: 'Conservative strategy focused on stable returns with minimal risk',
    category: 'Conservative',
    expectedAPY: 8.5,
    riskLevel: 'Low',
    minimumDeposit: 1000,
    features: ['Capital Preservation', 'Stable Returns', 'Low Volatility', 'Blue-chip Assets']
  },
  {
    id: 'balanced-growth',
    name: 'Balanced Growth',
    description: 'Balanced approach combining stable returns with moderate growth opportunities',
    category: 'Balanced',
    expectedAPY: 12.5,
    riskLevel: 'Medium',
    minimumDeposit: 5000,
    features: ['Diversified Portfolio', 'Risk Management', 'Growth Potential', 'Active Rebalancing']
  },
  {
    id: 'high-yield',
    name: 'High Yield',
    description: 'Aggressive strategy targeting maximum returns through optimized lending',
    category: 'Aggressive',
    expectedAPY: 18.5,
    riskLevel: 'High',
    minimumDeposit: 10000,
    features: ['Maximum Returns', 'Dynamic Allocation', 'Advanced Strategies', 'High Risk/Reward']
  },
  {
    id: 'yield-farming',
    name: 'Yield Farming Plus',
    description: 'Specialized in DeFi yield farming with compound rewards',
    category: 'Yield Farming',
    expectedAPY: 22.0,
    riskLevel: 'High',
    minimumDeposit: 25000,
    lockPeriod: 30,
    features: ['Compound Interest', 'Liquidity Mining', 'Token Rewards', 'Protocol Incentives']
  },
  {
    id: 'arbitrage',
    name: 'Cross-Chain Arbitrage',
    description: 'Exploits price differences across different chains and protocols',
    category: 'Arbitrage',
    expectedAPY: 15.5,
    riskLevel: 'Medium',
    minimumDeposit: 50000,
    features: ['Price Arbitrage', 'Cross-Chain', 'MEV Protection', 'Automated Trading']
  }
];

export const mockMarkets: Market[] = [
  {
    address: '0xmarket1_usdc_apt',
    name: 'USDC/APT Market',
    collateralToken: 'APT',
    borrowToken: 'USDC',
    lltv: 75,
    utilizationRate: 85.2,
    supplyAPY: 12.5,
    borrowAPY: 15.8,
    totalSupply: 2500000,
    totalBorrow: 1875000,
    isActive: true
  },
  {
    address: '0xmarket2_usdt_apt',
    name: 'USDT/APT Market',
    collateralToken: 'APT',
    borrowToken: 'USDT',
    lltv: 80,
    utilizationRate: 78.5,
    supplyAPY: 11.8,
    borrowAPY: 14.2,
    totalSupply: 1800000,
    totalBorrow: 1350000,
    isActive: true
  },
  {
    address: '0xmarket3_weth_usdc',
    name: 'WETH/USDC Market',
    collateralToken: 'WETH',
    borrowToken: 'USDC',
    lltv: 85,
    utilizationRate: 92.1,
    supplyAPY: 8.5,
    borrowAPY: 12.8,
    totalSupply: 5200000,
    totalBorrow: 4784000,
    isActive: true
  },
  {
    address: '0xmarket4_wbtc_usdt',
    name: 'WBTC/USDT Market',
    collateralToken: 'WBTC',
    borrowToken: 'USDT',
    lltv: 80,
    utilizationRate: 88.7,
    supplyAPY: 7.2,
    borrowAPY: 11.5,
    totalSupply: 3400000,
    totalBorrow: 2900000,
    isActive: true
  },
  {
    address: '0xmarket5_staked_apt',
    name: 'Staked APT Market',
    collateralToken: 'stAPT',
    borrowToken: 'USDC',
    lltv: 70,
    utilizationRate: 65.3,
    supplyAPY: 14.2,
    borrowAPY: 18.5,
    totalSupply: 800000,
    totalBorrow: 520000,
    isActive: true
  },
  {
    address: '0xmarket6_stable_lp',
    name: 'Stable LP Token Market',
    collateralToken: 'USDC-USDT-LP',
    borrowToken: 'USDC',
    lltv: 90,
    utilizationRate: 72.8,
    supplyAPY: 6.8,
    borrowAPY: 9.2,
    totalSupply: 1200000,
    totalBorrow: 950000,
    isActive: true
  }
];

export const mockDetailedVaults: DetailedVault[] = [
  {
    address: '0xvault1234567890abcdef',
    name: 'Stable Yield Strategy',
    symbol: 'SYS-VAULT',
    description: 'A conservative vault focused on stable returns through carefully selected blue-chip lending markets',
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: Date.now() - 86400000 * 90,
    
    strategy: mockVaultStrategies[0],
    
    timelock: 7,
    feeRate: 2.5,
    performanceFee: 15,
    guardian: '0xguardian123',
    guardianType: 'aragon',
    
    metrics: {
      totalValueLocked: 2500000,
      apy: 13.5,
      utilization: 82.5,
      totalSupplied: 2500000,
      totalBorrowed: 1875000,
      netAPY: 11.5,
      performanceHistory: [
        { timestamp: Date.now() - 86400000 * 30, apy: 11.2, tvl: 1800000 },
        { timestamp: Date.now() - 86400000 * 25, apy: 12.1, tvl: 2000000 },
        { timestamp: Date.now() - 86400000 * 20, apy: 12.8, tvl: 2200000 },
        { timestamp: Date.now() - 86400000 * 15, apy: 13.2, tvl: 2350000 },
        { timestamp: Date.now() - 86400000 * 10, apy: 13.5, tvl: 2500000 },
        { timestamp: Date.now() - 86400000 * 5, apy: 13.8, tvl: 2480000 },
        { timestamp: Date.now(), apy: 13.5, tvl: 2500000 }
      ]
    },
    
    positions: [
      {
        marketAddress: '0xmarket1_usdc_apt',
        marketName: 'USDC/APT Market',
        supplied: 1000000,
        borrowed: 750000,
        collateralValue: 1250000,
        utilization: 75.0,
        apy: 12.5,
        allocation: 40.0
      },
      {
        marketAddress: '0xmarket3_weth_usdc',
        marketName: 'WETH/USDC Market',
        supplied: 800000,
        borrowed: 680000,
        collateralValue: 850000,
        utilization: 85.0,
        apy: 8.5,
        allocation: 32.0
      },
      {
        marketAddress: '0xmarket6_stable_lp',
        marketName: 'Stable LP Token Market',
        supplied: 700000,
        borrowed: 445000,
        collateralValue: 780000,
        utilization: 63.6,
        apy: 6.8,
        allocation: 28.0
      }
    ],
    
    recentActivity: [
      {
        id: 'activity_1',
        type: 'deposit',
        timestamp: Date.now() - 86400000 * 2,
        user: '0xuser123',
        amount: 50000,
        details: 'Deposited 50,000 USDC',
        txHash: '0xtx123'
      },
      {
        id: 'activity_2',
        type: 'rebalance',
        timestamp: Date.now() - 86400000 * 5,
        user: '0x1234567890abcdef1234567890abcdef12345678',
        details: 'Rebalanced portfolio: increased WETH/USDC allocation',
        txHash: '0xtx124'
      },
      {
        id: 'activity_3',
        type: 'withdraw',
        timestamp: Date.now() - 86400000 * 7,
        user: '0xuser456',
        amount: 25000,
        details: 'Withdrew 25,000 USDC',
        txHash: '0xtx125'
      }
    ],
    
    hasOath: true,
    oathId: '1',
    
    isActive: true,
    isPaused: false,
    isEmergency: false
  },
  {
    address: '0xvault2345678901bcdef',
    name: 'Growth Focused Fund',
    symbol: 'GFF-VAULT',
    description: 'Balanced vault targeting higher returns through diversified lending strategies',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: Date.now() - 86400000 * 60,
    
    strategy: mockVaultStrategies[1],
    
    timelock: 7,
    feeRate: 3.0,
    performanceFee: 20,
    guardian: '0xguardian456',
    guardianType: 'multisig',
    
    metrics: {
      totalValueLocked: 5200000,
      apy: 18.2,
      utilization: 88.5,
      totalSupplied: 5200000,
      totalBorrowed: 4602000,
      netAPY: 15.8,
      performanceHistory: [
        { timestamp: Date.now() - 86400000 * 30, apy: 15.5, tvl: 3500000 },
        { timestamp: Date.now() - 86400000 * 25, apy: 16.8, tvl: 4000000 },
        { timestamp: Date.now() - 86400000 * 20, apy: 17.2, tvl: 4500000 },
        { timestamp: Date.now() - 86400000 * 15, apy: 17.8, tvl: 4800000 },
        { timestamp: Date.now() - 86400000 * 10, apy: 18.5, tvl: 5000000 },
        { timestamp: Date.now() - 86400000 * 5, apy: 18.8, tvl: 5100000 },
        { timestamp: Date.now(), apy: 18.2, tvl: 5200000 }
      ]
    },
    
    positions: [
      {
        marketAddress: '0xmarket1_usdc_apt',
        marketName: 'USDC/APT Market',
        supplied: 1800000,
        borrowed: 1350000,
        collateralValue: 2000000,
        utilization: 75.0,
        apy: 12.5,
        allocation: 34.6
      },
      {
        marketAddress: '0xmarket2_usdt_apt',
        marketName: 'USDT/APT Market',
        supplied: 1600000,
        borrowed: 1280000,
        collateralValue: 1750000,
        utilization: 80.0,
        apy: 11.8,
        allocation: 30.8
      },
      {
        marketAddress: '0xmarket5_staked_apt',
        marketName: 'Staked APT Market',
        supplied: 1800000,
        borrowed: 972000,
        collateralValue: 2200000,
        utilization: 54.0,
        apy: 14.2,
        allocation: 34.6
      }
    ],
    
    recentActivity: [
      {
        id: 'activity_4',
        type: 'market_add',
        timestamp: Date.now() - 86400000 * 3,
        user: '0xabcdef1234567890abcdef1234567890abcdef12',
        details: 'Added Staked APT Market to portfolio',
        txHash: '0xtx126'
      },
      {
        id: 'activity_5',
        type: 'deposit',
        timestamp: Date.now() - 86400000 * 4,
        user: '0xuser789',
        amount: 100000,
        details: 'Deposited 100,000 USDC',
        txHash: '0xtx127'
      }
    ],
    
    hasOath: true,
    oathId: '2',
    
    isActive: true,
    isPaused: false,
    isEmergency: false
  }
]; 