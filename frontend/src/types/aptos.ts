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
  moduleName: 'oath',
  functionName: 'create_oath'
};

export interface CreateOathArgs {
  content: string;
  description: string;
  category: string;
  collateralAmount: number;
  endTime: number;
}

export interface ViewOathArgs {
  creator_address: string;
  oath_id: number;
} 