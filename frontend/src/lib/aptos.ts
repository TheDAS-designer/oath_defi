import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { OATH_CONTRACT_CONFIG, CreateOathArgs, ViewOathArgs, AptosTransactionResponse } from '@/types/aptos';

const config = new AptosConfig({ 
  network: Network.TESTNET 
});

export const aptos = new Aptos(config);

export class OathContract {
  private static instance: OathContract;
  
  public static getInstance(): OathContract {
    if (!OathContract.instance) {
      OathContract.instance = new OathContract();
    }
    return OathContract.instance;
  }

  async createOath(
    account: any,
    args: CreateOathArgs
  ): Promise<AptosTransactionResponse> {
    try {
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::create_oath`,
          functionArguments: [
            args.content,
            args.description,
            args.category,
            args.collateralAmount,
            args.endTime
          ]
        }
      });

      const response = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction
      });

      return {
        hash: response.hash,
        success: true,
        gas_used: '0',
        vm_status: 'Executed successfully'
      };
    } catch (error) {
      console.error('Failed to create oath:', error);
      throw error;
    }
  }

  async getOath(args: ViewOathArgs) {
    try {
      const result = await aptos.view({
        payload: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::get_oath`,
          functionArguments: [args.creator_address, args.oath_id]
        }
      });
      return result;
    } catch (error) {
      console.error('Failed to get oath:', error);
      throw error;
    }
  }

  async completeOathAndMintSBT(
    account: any, 
    oathId: number, 
    completionTime: number
  ): Promise<AptosTransactionResponse> {
    try {
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::complete_oath_and_mint_sbt`,
          functionArguments: [oathId, completionTime]
        }
      });

      const response = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction
      });

      return {
        hash: response.hash,
        success: true,
        gas_used: '0',
        vm_status: 'Executed successfully'
      };
    } catch (error) {
      console.error('Failed to complete oath:', error);
      throw error;
    }
  }

  async getSBT(args: ViewOathArgs) {
    try {
      const result = await aptos.view({
        payload: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::get_sbt`,
          functionArguments: [args.creator_address, args.oath_id]
        }
      });
      return result;
    } catch (error) {
      console.error('Failed to get SBT:', error);
      throw error;
    }
  }

  async getAccountBalance(address: string): Promise<number> {
    try {
      const resources = await aptos.getAccountResources({ accountAddress: address });
      const coinResource = resources.find((r: any) => 
        r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      if (coinResource) {
        return parseInt((coinResource.data as any).coin.value) / 100000000; // Convert from Octas to APT
      }
      return 0;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 0;
    }
  }
} 