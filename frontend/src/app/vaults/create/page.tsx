'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, CheckCircle, TrendingUp, Settings, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { mockVaultStrategies, mockMarkets } from '@/lib/vaultMockData';
import { CreateVaultForm, Market, VaultStrategy } from '@/types/vault';
import { formatCurrency, formatPercentage } from '@/utils/format';

enum CreateStep {
  CONNECT_WALLET = 0,
  BASIC_INFO = 1,
  SELECT_STRATEGY = 2,
  SELECT_MARKETS = 3,
  CONFIGURATION = 4,
  GOVERNANCE = 5,
  REVIEW_DEPLOY = 6
}

export default function CreateVaultPage() {
  const router = useRouter();
  const { wallet, isConnected, connectWallet } = useWallet();
  
  const [currentStep, setCurrentStep] = useState<CreateStep>(
    isConnected ? CreateStep.BASIC_INFO : CreateStep.CONNECT_WALLET
  );
  
  const [form, setForm] = useState<CreateVaultForm>({
    name: '',
    symbol: '',
    description: '',
    strategyId: '',
    customStrategy: '',
    timelock: 7,
    feeRate: 2.5,
    performanceFee: 15,
    initialDeposit: 10000,
    selectedMarkets: [],
    allocations: {},
    guardianType: 'none',
    guardianConfig: {},
    acceptedTerms: false,
    acceptedRisks: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedStrategy = mockVaultStrategies.find(s => s.id === form.strategyId);

  // Auto-advance when wallet connects
  useEffect(() => {
    if (isConnected && currentStep === CreateStep.CONNECT_WALLET) {
      setCurrentStep(CreateStep.BASIC_INFO);
    }
  }, [isConnected, currentStep]);

  const updateForm = (updates: Partial<CreateVaultForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateAllocation = (marketAddress: string, percentage: number) => {
    setForm(prev => ({
      ...prev,
      allocations: { ...prev.allocations, [marketAddress]: percentage }
    }));
  };

  const toggleMarket = (market: Market) => {
    setForm(prev => {
      const isSelected = prev.selectedMarkets.some(m => m.address === market.address);
      if (isSelected) {
        const newAllocations = { ...prev.allocations };
        delete newAllocations[market.address];
        return {
          ...prev,
          selectedMarkets: prev.selectedMarkets.filter(m => m.address !== market.address),
          allocations: newAllocations
        };
      } else {
        return {
          ...prev,
          selectedMarkets: [...prev.selectedMarkets, market],
          allocations: { ...prev.allocations, [market.address]: 0 }
        };
      }
    });
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case CreateStep.CONNECT_WALLET:
        return isConnected;
      case CreateStep.BASIC_INFO:
        return form.name && form.symbol && form.description;
      case CreateStep.SELECT_STRATEGY:
        return form.strategyId !== '';
      case CreateStep.SELECT_MARKETS:
        return form.selectedMarkets.length > 0;
      case CreateStep.CONFIGURATION:
        const totalAllocation = Object.values(form.allocations).reduce((sum, val) => sum + val, 0);
        return Math.abs(totalAllocation - 100) < 0.1; // Allow small floating point errors
      case CreateStep.GOVERNANCE:
        return true; // All governance options are valid
      case CreateStep.REVIEW_DEPLOY:
        return form.acceptedTerms && form.acceptedRisks;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < CreateStep.REVIEW_DEPLOY) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > (isConnected ? CreateStep.BASIC_INFO : CreateStep.CONNECT_WALLET)) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!wallet) {
      setSubmitError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 构建 Vault 创建参数
      const vaultParams = {
        name: form.name,
        symbol: form.symbol,
        description: form.description,
        strategy_id: form.strategyId,
        timelock: form.timelock,
        fee_rate: Math.floor(form.feeRate * 100), // 转换为基点
        performance_fee: Math.floor(form.performanceFee * 100),
        markets: form.selectedMarkets.map(m => m.address),
        allocations: Object.values(form.allocations)
      };

      console.log('Creating vault with params:', vaultParams);

      // 模拟 Vault 创建过程（等待真实的 Vault 合约实现）
      // 在真实环境中，这里会调用专门的 Vault 创建 hook
      
      // 模拟交易延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功的交易结果
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const mockVaultAddress = '0x' + Math.random().toString(16).substr(2, 40);
      
      console.log('Vault created successfully with address:', mockVaultAddress);
      console.log('Transaction hash:', mockTxHash);

      // 导航到新创建的 vault 详情页
      router.push(`/vaults/${mockVaultAddress}`);
    } catch (error) {
      console.error('Failed to create vault:', error);
      
      let errorMessage = 'Failed to deploy vault. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to pay for transaction fees.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.';
        } else if (error.message.includes('No Aptos wallet detected')) {
          errorMessage = error.message;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: CreateStep.CONNECT_WALLET, title: 'Connect', description: 'Connect wallet' },
    { id: CreateStep.BASIC_INFO, title: 'Basic Info', description: 'Name & description' },
    { id: CreateStep.SELECT_STRATEGY, title: 'Strategy', description: 'Choose strategy' },
    { id: CreateStep.SELECT_MARKETS, title: 'Markets', description: 'Select markets' },
    { id: CreateStep.CONFIGURATION, title: 'Configure', description: 'Set allocations' },
    { id: CreateStep.GOVERNANCE, title: 'Governance', description: 'Guardian setup' },
    { id: CreateStep.REVIEW_DEPLOY, title: 'Deploy', description: 'Review & deploy' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/vaults" 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create MetaMorpho Vault</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-success-600 text-white' 
                    : currentStep === step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id + 1
                  )}
                </div>
                
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`w-12 h-px mx-4 ${
                    currentStep > step.id ? 'bg-success-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Step 0: Connect Wallet */}
          {currentStep === CreateStep.CONNECT_WALLET && (
            <div className="text-center py-12">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                To create a MetaMorpho Vault, you need to connect your Aptos wallet to deploy 
                the smart contract and manage the vault.
              </p>
              
              <button 
                onClick={connectWallet}
                className="btn-primary text-lg px-8 py-3"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === CreateStep.BASIC_INFO && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Basic Vault Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vault Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g., Stable Yield Strategy"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={form.symbol}
                    onChange={(e) => updateForm({ symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g., SYS-VAULT"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Describe your vault's investment strategy, target returns, and risk profile..."
                    rows={4}
                    className="input resize-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Strategy */}
          {currentStep === CreateStep.SELECT_STRATEGY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Choose Investment Strategy
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockVaultStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    onClick={() => updateForm({ strategyId: strategy.id })}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      form.strategyId === strategy.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {formatPercentage(strategy.expectedAPY)}
                        </div>
                        <div className="text-xs text-gray-500">Expected APY</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{strategy.description}</p>
                    
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                        strategy.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {strategy.riskLevel} Risk
                      </span>
                      <span className="text-gray-500">Min: {formatCurrency(strategy.minimumDeposit)}</span>
                    </div>
                    
                    <div className="space-y-1">
                      {strategy.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Markets */}
          {currentStep === CreateStep.SELECT_MARKETS && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Select Lending Markets
              </h2>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Market Selection Tips:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Choose markets that align with your strategy's risk profile</li>
                  <li>• Diversify across different collateral types to reduce risk</li>
                  <li>• Consider market liquidity and utilization rates</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                {mockMarkets.map((market) => (
                  <div
                    key={market.address}
                    onClick={() => toggleMarket(market)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      form.selectedMarkets.some(m => m.address === market.address)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{market.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Supply APY:</span>
                            <div className="font-medium text-green-600">{formatPercentage(market.supplyAPY)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Utilization:</span>
                            <div className="font-medium">{formatPercentage(market.utilizationRate)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">LLTV:</span>
                            <div className="font-medium">{market.lltv}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">TVL:</span>
                            <div className="font-medium">{formatCurrency(market.totalSupply)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        form.selectedMarkets.some(m => m.address === market.address)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {form.selectedMarkets.some(m => m.address === market.address) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Configuration */}
          {currentStep === CreateStep.CONFIGURATION && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Vault Configuration
              </h2>
              
              <div className="space-y-8">
                {/* Market Allocations */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Market Allocations</h3>
                  <div className="space-y-4">
                    {form.selectedMarkets.map((market) => (
                      <div key={market.address} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{market.name}</div>
                          <div className="text-sm text-gray-500">{formatPercentage(market.supplyAPY)} APY</div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={form.allocations[market.address] || 0}
                              onChange={(e) => updateAllocation(market.address, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.1"
                              className="input w-20 text-center"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-primary-900">Total Allocation:</span>
                        <span className={`text-lg font-bold ${
                          Math.abs(Object.values(form.allocations).reduce((sum, val) => sum + val, 0) - 100) < 0.1
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {Object.values(form.allocations).reduce((sum, val) => sum + val, 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vault Parameters */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vault Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timelock (days)
                      </label>
                      <input
                        type="number"
                        value={form.timelock}
                        onChange={(e) => updateForm({ timelock: parseInt(e.target.value) || 7 })}
                        min="1"
                        max="30"
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Time delay for parameter changes</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Management Fee (%)
                      </label>
                      <input
                        type="number"
                        value={form.feeRate}
                        onChange={(e) => updateForm({ feeRate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="10"
                        step="0.1"
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Annual fee on assets under management</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Performance Fee (%)
                      </label>
                      <input
                        type="number"
                        value={form.performanceFee}
                        onChange={(e) => updateForm({ performanceFee: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="50"
                        step="1"
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Fee on profits above benchmark</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Deposit (USDC)
                      </label>
                      <input
                        type="number"
                        value={form.initialDeposit}
                        onChange={(e) => updateForm({ initialDeposit: parseFloat(e.target.value) || 0 })}
                        min="1000"
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your initial deposit to bootstrap the vault</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Governance */}
          {currentStep === CreateStep.GOVERNANCE && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Governance & Guardian Setup
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Guardian Type
                  </label>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'none', name: 'No Guardian', description: 'Fast operations, higher risk' },
                      { id: 'multisig', name: 'Multisig Guardian', description: 'Multiple signers required for emergency actions' },
                      { id: 'aragon', name: 'Aragon DAO', description: 'Fully decentralized, token-based governance' },
                      { id: 'custom', name: 'Custom Guardian', description: 'Your own guardian contract' }
                    ].map((option) => (
                      <div
                        key={option.id}
                        onClick={() => updateForm({ guardianType: option.id as any })}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          form.guardianType === option.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            form.guardianType === option.id
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}>
                            {form.guardianType === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{option.name}</h3>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Deploy */}
          {currentStep === CreateStep.REVIEW_DEPLOY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Review & Deploy Vault
              </h2>
              
              <div className="space-y-6">
                {/* Vault Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Vault Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{form.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Symbol:</span>
                        <span className="font-medium">{form.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strategy:</span>
                        <span className="font-medium">{selectedStrategy?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Markets:</span>
                        <span className="font-medium">{form.selectedMarkets.length}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Management Fee:</span>
                        <span className="font-medium">{form.feeRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Performance Fee:</span>
                        <span className="font-medium">{form.performanceFee}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timelock:</span>
                        <span className="font-medium">{form.timelock} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initial Deposit:</span>
                        <span className="font-medium">{formatCurrency(form.initialDeposit)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={form.acceptedTerms}
                      onChange={(e) => updateForm({ acceptedTerms: e.target.checked })}
                      className="mt-1"
                    />
                    <label className="text-sm text-gray-700">
                      I understand and accept the terms and conditions of creating a MetaMorpho Vault, 
                      including the responsibilities of vault management and fee structures.
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={form.acceptedRisks}
                      onChange={(e) => updateForm({ acceptedRisks: e.target.checked })}
                      className="mt-1"
                    />
                    <label className="text-sm text-gray-700">
                      I acknowledge the risks associated with DeFi lending, including but not limited to 
                      smart contract risks, market volatility, and potential loss of funds.
                    </label>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{submitError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > (isConnected ? CreateStep.BASIC_INFO : CreateStep.CONNECT_WALLET) ? (
              <button
                onClick={handleBack}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < CreateStep.REVIEW_DEPLOY ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToNext()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8"
              >
                {isSubmitting ? 'Deploying Vault...' : 'Deploy Vault'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 