export interface AptosWalletInfo {
  address: string;
  balance: number;
  network: 'testnet' | 'mainnet';
  publicKey: string;
}

export interface AptosTransactionResponse {
  hash: string;
  success: boolean;
  gas_used: string;
  vm_status: string;
}

export interface ContractConfig {
  contractAddress: string;
  moduleName: string;
  functionName: string;
}

export const OATH_CONTRACT_CONFIG: ContractConfig = {
  contractAddress: '0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0',
  moduleName: 'oath_vault_v7',
  functionName: 'create_oath_with_tokens'
  
};

export interface CollateralTokenData {
  token_address: string;
  address: string;
  amount: number;
  symbol: string;
  usdValue: number;
}

export interface CreateOathArgs {
  content: string;
  description: string;
  category: string;
  collateralAmount: number;
  endTime: number;
  // 扩展字段支持更复杂的oath类型
  vaultAddress?: string;
  targetAPY?: number;
  categoryId: string;
  collateralTokens?: CollateralTokenData[];
  // templateId: string;
  // parameters: { [key: string]: any };
}

export interface ViewOathArgs {
  creator_address: string;
  oath_id: number;
}

// 扩展的合约交互接口
export interface CreateOathWithCollateralArgs {
  content: string;
  description: string;
  category: string;
  endTime: number;
  collateralTokens: CollateralTokenData[];
  categoryId: string;
}

export interface StakeCollateralArgs {
  oath_id: number;
  token_address: string;
  amount: number;
} 