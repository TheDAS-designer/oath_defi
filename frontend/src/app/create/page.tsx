'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { mockOathTemplates, mockMetaMorphoVaults } from '@/lib/mockData';
import { OathTemplate, CollateralToken } from '@/types/oath';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface CreateOathForm {
  templateId: string;
  vaultAddress: string;
  parameters: { [key: string]: string | number };
  collateralTokens: CollateralToken[];
  totalCollateralValue: number;
  duration: number;
  evidence: string;
}

enum CreateStep {
  CONNECT_WALLET = 0,
  SELECT_TEMPLATE = 1,
  CONFIGURE_PARAMS = 2,
  SET_COLLATERAL = 3,
  REVIEW_CONFIRM = 4
}

export default function CreateOathPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vaultParam = searchParams?.get('vault');
  
  const { wallet, isConnected, connectWallet } = useWallet();
  
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
    evidence: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      address: '0xusdc',
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
        return selectedTemplate.parameters.every(param => {
          if (!param.required) return true;
          const value = form.parameters[param.key];
          return value !== undefined && value !== '' && value !== 0;
        });
      case CreateStep.SET_COLLATERAL:
        return form.collateralTokens.length > 0 && 
               form.totalCollateralValue >= (selectedTemplate?.minimumCollateral || 0);
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
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, just navigate to the oath details
      // In real implementation, you would call the smart contract here
      router.push('/oaths/1');
    } catch (error) {
      setSubmitError('Failed to create oath. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              
              <div className="space-y-6">
                {selectedTemplate.parameters.map((param) => (
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
                ))}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => updateForm({ duration: parseInt(e.target.value) || 30 })}
                    min="7"
                    max="365"
                    className="input"
                    required
                  />
                </div>

                {/* Vault Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vault {selectedTemplate.parameters.some(p => p.key === 'vaultAddress') && '*'}
                  </label>
                  <select
                    value={form.vaultAddress}
                    onChange={(e) => updateForm({ vaultAddress: e.target.value })}
                    className="input"
                  >
                    <option value="">Choose a vault...</option>
                    {mockMetaMorphoVaults.map((vault) => (
                      <option key={vault.address} value={vault.address}>
                        {vault.name} ({formatPercentage(vault.currentAPY)} APY)
                      </option>
                    ))}
                  </select>
                </div>
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
                          address: `0x${e.target.value.toLowerCase()}`
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Review Your Oath
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Oath Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </div>
                  
                  {Object.entries(form.parameters).map(([key, value]) => {
                    const param = selectedTemplate.parameters.find(p => p.key === key);
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{param?.label}:</span>
                        <span className="font-medium">
                          {param?.type === 'number' && param.key.includes('APY') 
                            ? formatPercentage(value as number)
                            : value?.toString()
                          }
                        </span>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{form.duration} days</span>
                  </div>
                  
                  {selectedVault && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vault:</span>
                      <span className="font-medium">{selectedVault.name}</span>
                    </div>
                  )}
                  
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
            </div>
          )}

          {/* Navigation */}
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
        </div>
      </div>
    </div>
  );
} 