'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { mockOathTemplates, mockMetaMorphoVaults } from '@/lib/mockData';
import { OathTemplate, CollateralToken } from '@/types/oath';
import { formatCurrency, formatPercentage, formatTransactionHash, getAptosExplorerUrl } from '@/utils/format';
import { useAptos } from '@/hooks/useAptos';
import { OATH_CONTRACT_CONFIG } from '@/types/aptos';


interface CreateOathForm {
  templateId: string;
  vaultAddress: string;
  parameters: { [key: string]: string | number };
  collateralTokens: CollateralToken[];
  totalCollateralValue: number;
  duration: number;
  evidence: string;
  // 新增字段
  name: string;
  description: string;
}

enum CreateStep {
  CONNECT_WALLET = 0,
  SELECT_TEMPLATE = 1,
  CONFIGURE_PARAMS = 2,
  SET_COLLATERAL = 3,
  REVIEW_CONFIRM = 4
}

// Token地址映射（模拟真实的token地址）
const TOKEN_ADDRESSES = {
  'USDC': '0x1::coin::CoinStore<0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832::asset::USDC>',
  'APT': '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
  'USDT': '0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>'
};

export default function CreateOathPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vaultParam = searchParams?.get('vault');
  const { createOath } = useAptos();
  
  const { wallet, isConnected, connectWallet, signAndSubmitTransaction } = useWallet();
  
  const [currentStep, setCurrentStep] = useState<CreateStep>(
    isConnected ? CreateStep.SELECT_TEMPLATE : CreateStep.CONNECT_WALLET
  );
  
  const [form, setForm] = useState<CreateOathForm>({
    templateId: '',
    vaultAddress: vaultParam || '',
    parameters: {},
    collateralTokens: [],
    totalCollateralValue: 0,
    duration: 30,
    evidence: '',
    name: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{
    transactionHash: string;
    oathId: string;
  } | null>(null);

  const selectedTemplate = mockOathTemplates.find(t => t.id === form.templateId);
  const selectedVault = mockMetaMorphoVaults.find(v => v.address === form.vaultAddress);

  // Auto-advance when wallet connects
  useEffect(() => {
    if (isConnected && currentStep === CreateStep.CONNECT_WALLET) {
      setCurrentStep(CreateStep.SELECT_TEMPLATE);
    }
  }, [isConnected, currentStep]);

  // Pre-select APY template if coming from vault
  useEffect(() => {
    if (vaultParam && selectedTemplate?.id !== 'apy-guarantee') {
      setForm(prev => ({ ...prev, templateId: 'apy-guarantee' }));
    }
  }, [vaultParam, selectedTemplate?.id]);

  // Auto-populate name and description when template changes
  useEffect(() => {
    if (selectedTemplate && form.templateId === selectedTemplate.id) {
      // 只在name和description为空时自动填充，避免覆盖用户输入
      if (!form.name) {
        let defaultName = selectedTemplate.name;
        
        // 根据模板类型和选择的vault生成更智能的默认名称
        if (selectedTemplate.id === 'apy-guarantee' && selectedVault) {
          defaultName = `APY Guarantee for ${selectedVault.name}`;
        } else if (selectedTemplate.id === 'token-lock') {
          defaultName = `Token Lock Commitment`;
        } else if (selectedTemplate.id === 'performance-target') {
          defaultName = `Performance Target Commitment`;
        }
        
        setForm(prev => ({ ...prev, name: defaultName }));
      }
      
      if (!form.description) {
        let defaultDescription = selectedTemplate.description;
        
        // 根据模板类型生成更详细的默认描述
        if (selectedTemplate.id === 'apy-guarantee') {
          defaultDescription = `I commit to maintaining the specified APY performance for the selected vault. This commitment includes regular monitoring and strategic adjustments to ensure target performance is met.`;
        } else if (selectedTemplate.id === 'token-lock') {
          defaultDescription = `I commit to locking the specified tokens for the agreed duration to demonstrate long-term commitment to the project and build trust with the community.`;
        } else if (selectedTemplate.id === 'performance-target') {
          defaultDescription = `I commit to achieving the specified performance targets within the given timeframe, with clear metrics and measurement criteria.`;
        }
        
        setForm(prev => ({ ...prev, description: defaultDescription }));
      }
    }
  }, [selectedTemplate, form.templateId, selectedVault, form.name, form.description]);

  const updateForm = (updates: Partial<CreateOathForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateParameter = (key: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value }
    }));
  };

  const addCollateralToken = () => {
    const newToken: CollateralToken = {
      symbol: 'USDC',
      amount: 1000,
      address: TOKEN_ADDRESSES['USDC'],
      usdValue: 1000
    };
    
    setForm(prev => ({
      ...prev,
      collateralTokens: [...prev.collateralTokens, newToken],
      totalCollateralValue: prev.totalCollateralValue + newToken.usdValue
    }));
  };

  const updateCollateralToken = (index: number, updates: Partial<CollateralToken>) => {
    setForm(prev => {
      const newTokens = [...prev.collateralTokens];
      newTokens[index] = { ...newTokens[index], ...updates };
      
      const totalValue = newTokens.reduce((sum, token) => sum + token.usdValue, 0);
      
      return {
        ...prev,
        collateralTokens: newTokens,
        totalCollateralValue: totalValue
      };
    });
  };

  const removeCollateralToken = (index: number) => {
    setForm(prev => {
      const newTokens = prev.collateralTokens.filter((_, i) => i !== index);
      const totalValue = newTokens.reduce((sum, token) => sum + token.usdValue, 0);
      
      return {
        ...prev,
        collateralTokens: newTokens,
        totalCollateralValue: totalValue
      };
    });
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case CreateStep.CONNECT_WALLET:
        return isConnected;
      case CreateStep.SELECT_TEMPLATE:
        return form.templateId !== '';
      case CreateStep.CONFIGURE_PARAMS:
        if (!selectedTemplate) return false;
        
        // 验证name和description
        if (!form.name.trim() || !form.description.trim()) return false;
        
        // 验证模板参数
        return selectedTemplate.parameters.every(param => {
          if (!param.required) return true;
          const value = form.parameters[param.key];
          
          // Special handling for vaultAddress - use form.vaultAddress if not in parameters
          if (param.key === 'vaultAddress') {
            return (value && value !== '') || (form.vaultAddress && form.vaultAddress !== '');
          }
          
          // Special handling for duration - use form.duration if not in parameters
          if (param.key === 'duration') {
            return (value && value !== 0) || (form.duration && form.duration > 0);
          }
          
          return value !== undefined && value !== '' && value !== 0;
        });
      case CreateStep.SET_COLLATERAL:
        // 更严格的collateral验证
        const hasValidTokens = form.collateralTokens.length > 0 && 
                              form.collateralTokens.every(token => 
                                token.amount > 0 && 
                                token.address && 
                                token.symbol
                              );
        const meetsMinimum = form.totalCollateralValue >= (selectedTemplate?.minimumCollateral || 0);
        return hasValidTokens && meetsMinimum;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < CreateStep.REVIEW_CONFIRM) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > (isConnected ? CreateStep.SELECT_TEMPLATE : CreateStep.CONNECT_WALLET)) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!wallet) {
      setSubmitError('Please connect your wallet first');
      return;
    }

    if (!selectedTemplate) {
      setSubmitError('Please select an oath template');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // 构建oath内容 - 使用用户输入的name作为主要内容
      let oathContent = form.name.trim();
      let description = form.description.trim();
      
      // 根据模板参数构建具体内容补充信息
      selectedTemplate.parameters.forEach(param => {
        let value = form.parameters[param.key];
        
        if (param.key === 'vaultAddress') {
          value = value || form.vaultAddress;
          if (value && selectedVault) {
            oathContent += ` for vault ${selectedVault.name} (${value})`;
          }
        } else if (param.key === 'duration') {
          value = value || form.duration;
          oathContent += ` for ${value} days`;
        } else if (param.key === 'targetAPY') {
          oathContent += ` with target APY of ${value}%`;
        } else if (param.key === 'tokenSymbol') {
          oathContent += ` for ${value} tokens`;
        } else if (param.key === 'lockAmount') {
          oathContent += ` locking ${value} tokens`;
        }
      });

      // 计算结束时间 (当前时间 + duration天)
      const endTime = Math.floor(Date.now() / 1000) + (form.duration * 24 * 60 * 60);
      
      // 构建collateral tokens数据
      const collateralTokens = form.collateralTokens.map(token => ({
        token_address: token.address,
        address: token.address,
        amount: token.amount,
        symbol: token.symbol,
        usdValue: token.usdValue
      }));

      // 构建合约参数
      const createOathArgs = {
        content: oathContent,
        description: description,
        category: selectedTemplate.category,
        collateralAmount: form.totalCollateralValue,
        endTime: endTime,
        vaultAddress: form.vaultAddress,
        targetAPY: typeof form.parameters.targetAPY === 'number' ? form.parameters.targetAPY : undefined,
        collateralTokens: collateralTokens,
        categoryId: selectedTemplate.id,
      };

      console.log('Creating oath with args:', createOathArgs);
      console.log('Wallet:', wallet);

      // 使用钱包适配器提交交易
      console.log('Preparing transaction with wallet adapter...');
      
      const payload = {
        type: "entry_function_payload",
        function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::${OATH_CONTRACT_CONFIG.functionName}`,
        arguments: [
          createOathArgs.content,
          createOathArgs.description,
          createOathArgs.category,
          createOathArgs.collateralAmount,
          createOathArgs.endTime,
          createOathArgs.vaultAddress,
          createOathArgs.targetAPY || 0,
          createOathArgs.categoryId,
          createOathArgs.collateralTokens.map(t => t.symbol),
          createOathArgs.collateralTokens.map(t => t.amount),
          createOathArgs.collateralTokens.map(t => t.address),
          createOathArgs.collateralTokens.map(t => t.usdValue),
        ],
        type_arguments: []
      };

      console.log('Submitting transaction with payload:', payload);
      
      // 通过钱包签名并提交交易
      const result = await signAndSubmitTransaction(payload);
      console.log('Transaction result:', result);
      
      console.log('Oath created successfully:', result);

      // 在真实环境中，你可能需要从交易结果中解析oath ID
      const mockOathId = Math.floor(Math.random() * 1000) + 1;
      
      // 设置成功状态而不是立即跳转
      setSuccessState({
        transactionHash: result.hash,
        oathId: mockOathId.toString()
      });
      
    } catch (error) {
      console.error('Failed to create oath:', error);
      
      let errorMessage = 'Failed to create oath. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to pay for transaction fees.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
          errorMessage = 'Insufficient token balance for collateral staking.';
        } else if (error.message.includes('INVALID_COLLATERAL')) {
          errorMessage = 'Invalid collateral configuration. Please check your token amounts.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateDefaults = () => {
    if (selectedTemplate) {
      let defaultName = selectedTemplate.name;
      let defaultDescription = selectedTemplate.description;
      
      // 根据模板类型和选择的vault生成更智能的默认名称
      if (selectedTemplate.id === 'apy-guarantee' && selectedVault) {
        defaultName = `APY Guarantee for ${selectedVault.name}`;
      } else if (selectedTemplate.id === 'token-lock') {
        defaultName = `Token Lock Commitment`;
      } else if (selectedTemplate.id === 'performance-target') {
        defaultName = `Performance Target Commitment`;
      }
      
      // 根据模板类型生成更详细的默认描述
      if (selectedTemplate.id === 'apy-guarantee') {
        defaultDescription = `I commit to maintaining the specified APY performance for the selected vault. This commitment includes regular monitoring and strategic adjustments to ensure target performance is met.`;
      } else if (selectedTemplate.id === 'token-lock') {
        defaultDescription = `I commit to locking the specified tokens for the agreed duration to demonstrate long-term commitment to the project and build trust with the community.`;
      } else if (selectedTemplate.id === 'performance-target') {
        defaultDescription = `I commit to achieving the specified performance targets within the given timeframe, with clear metrics and measurement criteria.`;
      }
      
      setForm(prev => ({
        ...prev,
        name: defaultName,
        description: defaultDescription
      }));
    }
  };

  const steps = [
    { id: CreateStep.CONNECT_WALLET, title: 'Connect Wallet', description: 'Connect your Aptos wallet' },
    { id: CreateStep.SELECT_TEMPLATE, title: 'Select Template', description: 'Choose oath type' },
    { id: CreateStep.CONFIGURE_PARAMS, title: 'Configure', description: 'Set parameters' },
    { id: CreateStep.SET_COLLATERAL, title: 'Collateral', description: 'Stake tokens' },
    { id: CreateStep.REVIEW_CONFIRM, title: 'Review', description: 'Confirm & submit' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/oaths" 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Oath</h1>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                To create an oath, you need to connect your Aptos wallet to stake collateral 
                and sign the commitment transaction.
              </p>
              
              <button 
                onClick={connectWallet}
                className="btn-primary text-lg px-8 py-3"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Step 1: Select Template */}
          {currentStep === CreateStep.SELECT_TEMPLATE && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Choose Oath Template
              </h2>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Template Categories:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>Performance/Growth/Risk Control:</strong> Commitments related to MetaMorpho Vaults</li>
                  <li><strong>Trust Building:</strong> Independent commitments (like token locks) to establish credibility</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockOathTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => updateForm({ templateId: template.id })}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      form.templateId === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{template.category}</span>
                      <span className="font-medium text-gray-900">
                        Min: {formatCurrency(template.minimumCollateral)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configure Parameters */}
          {currentStep === CreateStep.CONFIGURE_PARAMS && selectedTemplate && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Configure {selectedTemplate.name}
              </h2>
              
              {selectedTemplate.id === 'token-lock' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Token Lock Commitment:</h3>
                  <p className="text-sm text-yellow-700">
                    This commitment locks your project tokens for a specified period to build trust with investors. 
                    This is independent of any vault and demonstrates long-term commitment to your project.
                  </p>
                </div>
              )}
              
              <div className="space-y-6">
                
                {/* Oath Name and Description */}
                <div className="space-y-4 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Oath Details</h3>
                    <button
                      type="button"
                      onClick={regenerateDefaults}
                      className="text-sm text-primary-600 hover:text-primary-700 underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oath Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      placeholder="Enter a descriptive name for your oath"
                      className="input"
                      maxLength={100}
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        This will be the public display name for your oath
                      </p>
                      <span className={`text-xs ${form.name.length > 80 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {form.name.length}/100
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm({ description: e.target.value })}
                      placeholder="Provide detailed information about your commitment"
                      className="input min-h-[100px] resize-y"
                      rows={4}
                      maxLength={500}
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        Explain your commitment and how it will be measured
                      </p>
                      <span className={`text-xs ${form.description.length > 400 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {form.description.length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic form fields based on template parameters */}
                {selectedTemplate.parameters.map((param) => {
                  // Handle special cases for different parameter types
                  if (param.key === 'vaultAddress') {
                    return (
                      <div key={param.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {param.label}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                          value={form.parameters[param.key] || form.vaultAddress}
                          onChange={(e) => {
                            updateParameter(param.key, e.target.value);
                            updateForm({ vaultAddress: e.target.value });
                          }}
                          className="input"
                          required={param.required}
                        >
                          <option value="">Choose a vault...</option>
                          {mockMetaMorphoVaults.map((vault) => (
                            <option key={vault.address} value={vault.address}>
                              {vault.name} ({formatPercentage(vault.currentAPY)} APY)
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  
                  if (param.key === 'duration') {
                    return (
                      <div key={param.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {param.label}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="number"
                          value={form.parameters[param.key] || form.duration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || (param.min || 7);
                            updateParameter(param.key, value);
                            updateForm({ duration: value });
                          }}
                          placeholder={param.placeholder}
                          min={param.min}
                          max={param.max}
                          className="input"
                          required={param.required}
                        />
                      </div>
                    );
                  }
                  
                  // Handle other parameter types normally
                  return (
                    <div key={param.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {param.label}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {param.type === 'number' ? (
                        <input
                          type="number"
                          value={form.parameters[param.key] || ''}
                          onChange={(e) => updateParameter(param.key, parseFloat(e.target.value) || 0)}
                          placeholder={param.placeholder}
                          min={param.min}
                          max={param.max}
                          className="input"
                          required={param.required}
                        />
                      ) : (
                        <input
                          type="text"
                          value={form.parameters[param.key] || ''}
                          onChange={(e) => updateParameter(param.key, e.target.value)}
                          placeholder={param.placeholder}
                          className="input"
                          required={param.required}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Set Collateral */}
          {currentStep === CreateStep.SET_COLLATERAL && selectedTemplate && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Stake Collateral
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important: Risk Warning
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      If you fail to meet your oath commitments, your collateral will be slashed 
                      and distributed to affected users. Only stake what you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {form.collateralTokens.map((token, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <select
                        value={token.symbol}
                        onChange={(e) => updateCollateralToken(index, { 
                          symbol: e.target.value,
                          address: TOKEN_ADDRESSES[e.target.value as keyof typeof TOKEN_ADDRESSES] || `0x${e.target.value.toLowerCase()}`
                        })}
                        className="input"
                      >
                        <option value="USDC">USDC</option>
                        <option value="APT">APT</option>
                        <option value="USDT">USDT</option>
                      </select>
                      
                      <input
                        type="number"
                        value={token.amount}
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          updateCollateralToken(index, { 
                            amount,
                            usdValue: token.symbol === 'APT' ? amount * 8 : amount // Mock price
                          });
                        }}
                        placeholder="Amount"
                        className="input"
                      />
                      
                      <div className="input bg-gray-100 text-gray-700">
                        {formatCurrency(token.usdValue)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeCollateralToken(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addCollateralToken}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Coins className="h-4 w-4" />
                  <span>Add Token</span>
                </button>
                
                <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-primary-900">Total Collateral:</span>
                    <span className="text-xl font-bold text-primary-900">
                      {formatCurrency(form.totalCollateralValue)}
                    </span>
                  </div>
                  <div className="text-sm text-primary-700 mt-1">
                    Minimum required: {formatCurrency(selectedTemplate.minimumCollateral)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === CreateStep.REVIEW_CONFIRM && selectedTemplate && (
            <div>
              {!successState ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Review Your Oath
                  </h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Oath Summary</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{form.name}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Description:</span>
                        <span className="font-medium text-xs bg-white p-2 rounded border">
                          {form.description}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Template:</span>
                        <span className="font-medium">{selectedTemplate.name}</span>
                      </div>
                      
                      {selectedTemplate.parameters.map((param) => {
                        let value = form.parameters[param.key];
                        
                        // Handle special cases
                        if (param.key === 'vaultAddress') {
                          value = value || form.vaultAddress;
                        } else if (param.key === 'duration') {
                          value = value || form.duration;
                        }
                        
                        if (!value && !param.required) return null;
                        
                        return (
                          <div key={param.key} className="flex justify-between">
                            <span className="text-gray-600">{param.label}:</span>
                            <span className="font-medium">
                              {param.type === 'number' && param.key.includes('APY') 
                                ? formatPercentage(value as number)
                                : param.key === 'vaultAddress' && selectedVault
                                ? selectedVault.name
                                : value?.toString()
                              }
                            </span>
                          </div>
                        );
                      })}
                      
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Total Collateral:</span>
                        <span className="font-bold text-lg">{formatCurrency(form.totalCollateralValue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-red-800 mb-2">Final Confirmation</h4>
                    <p className="text-sm text-red-700">
                      By creating this oath, I understand that if I fail to meet the specified commitments, 
                      my collateral will be slashed and distributed to affected users. This action cannot be undone.
                    </p>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800">{submitError}</p>
                    </div>
                  )}

                  {/* Transaction Status */}
                  {isSubmitting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <div>
                          <h4 className="font-medium text-blue-800">Creating Oath...</h4>
                          <p className="text-sm text-blue-700">
                            Please confirm the transaction in your wallet and wait for blockchain confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Ready State */}
                  {!isSubmitting && !submitError && wallet && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-800 mb-2">Ready to Create</h4>
                      <p className="text-sm text-gray-600">
                        Connected as: <span className="font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: {wallet.balance.toFixed(4)} APT
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-success-600" />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Oath Created Successfully!
                  </h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Oath ID:</span>
                        <span className="font-mono font-medium">#{successState.oathId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction:</span>
                        <a 
                          href={getAptosExplorerUrl(successState.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary-600 hover:text-primary-700 underline"
                        >
                          {formatTransactionHash(successState.transactionHash)}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium">Aptos Testnet</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => router.push(`/oaths/${successState.oathId}`)}
                      className="btn-primary"
                    >
                      View Oath Details
                    </button>
                    <button
                      onClick={() => {
                        setSuccessState(null);
                        setCurrentStep(CreateStep.SELECT_TEMPLATE);
                        setForm({
                          templateId: '',
                          vaultAddress: '',
                          parameters: {},
                          collateralTokens: [],
                          totalCollateralValue: 0,
                          duration: 30,
                          evidence: '',
                          name: '',
                          description: ''
                        });
                      }}
                      className="btn-secondary"
                    >
                      Create Another Oath
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {!successState && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > (isConnected ? CreateStep.SELECT_TEMPLATE : CreateStep.CONNECT_WALLET) ? (
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

              {currentStep < CreateStep.REVIEW_CONFIRM ? (
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
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Oath...' : 'Create Oath'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 