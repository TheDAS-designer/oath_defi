import { Aptos, AptosConfig, Network , Account} from '@aptos-labs/ts-sdk';
import { 
  OATH_CONTRACT_CONFIG, 
  CreateOathArgs, 
  CreateOathWithCollateralArgs,
  StakeCollateralArgs,
  ViewOathArgs, 
  AptosTransactionResponse,
  CollateralTokenData 
} from '@/types/aptos';

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

  async createOath_bak(
    account: Account,
    args: CreateOathArgs
  ): Promise<AptosTransactionResponse> {
    try {
      // 如果有多个collateral tokens，使用扩展版本的创建方法
      if (args.collateralTokens && args.collateralTokens.length > 0) {
        return this.createOathWithCollateral(account, {
          content: args.content,
          description: args.description,
          category: args.category,
          endTime: args.endTime,
          collateralTokens: args.collateralTokens,
          categoryId: args.categoryId,
        });
      }

      // 使用原有的简单创建方法
      const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::create_oath`,
          functionArguments: [
            args.content,
            args.description,
            args.category,
            JSON.stringify(args.collateralTokens),
            args.endTime,
            args.categoryId
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



  /**
   * 创建带有详细抵押代币信息的誓言
   * @param account 签名账户
   * @param params 创建誓言的参数
   */
  async createOath(
    account: any,
    params: CreateOathArgs
  ) {
    if(!params || !params.collateralTokens) {
      throw new Error('No collateral tokens provided');
    }

    console.log("params", params);
    // 提取 collateral tokens 的各个字段
    const tokenSymbols = params.collateralTokens.map(token => token.symbol);
    const tokenAmounts = params.collateralTokens.map(token => token.amount);
    const tokenAddresses = params.collateralTokens.map(token => token.token_address);
    const tokenUsdValues = params.collateralTokens.map(token => 123);

    console.log("account", account);


    const transaction = await aptos.transaction.build.simple({
      sender: account.address,
      data: {
        function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::${OATH_CONTRACT_CONFIG.functionName}`,
        typeArguments: [],
        functionArguments: [
          params.content,
          params.description,
          params.category,
          params.collateralAmount,
          params.endTime,
          params.vaultAddress,
          params.targetAPY,
          params.categoryId,
          tokenSymbols,
          tokenAmounts,
          tokenAddresses,
          tokenUsdValues,
        ],
      },
    });


    console.log("transaction", transaction)
    
    // 检查是否为浏览器钱包
    if (typeof window !== 'undefined' && (window as any).aptos && account.accountAddress) {
      // 构建钱包交易 payload
      const payload = {
        type: "entry_function_payload",
        function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::${OATH_CONTRACT_CONFIG.functionName}`,
        arguments: [
          params.content,
          params.description,
          params.category,
          params.collateralAmount,
          params.endTime,
          params.vaultAddress,
          params.targetAPY,
          params.categoryId,
          tokenSymbols,
          tokenAmounts,
          tokenAddresses,
          tokenUsdValues,
        ],
        type_arguments: []
      };
      
      console.log("Submitting transaction via wallet:", payload);
      
      // 通过钱包签名并提交
      const committedTxn = await (window as any).aptos.signAndSubmitTransaction(payload);
      
      // 等待交易确认
      await (window as any).aptos.waitForTransaction(committedTxn.hash);
      
      return {
        hash: committedTxn.hash,
        success: true,
        gas_used: '0',
        vm_status: 'Executed successfully'
      };
    } else {
      // 对于服务器端或没有钱包的情况，使用 SDK 签名
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });
      
      return {
        hash: committedTxn.hash,
        success: true,
        gas_used: '0',
        vm_status: 'Executed successfully'
      };
    }
  }

  async createOathWithCollateral(
    account: any,
    args: CreateOathWithCollateralArgs
  ): Promise<AptosTransactionResponse> {
    try {
      // 准备collateral token数据
      const tokenAddresses = args.collateralTokens.map(token => token.token_address);
      const tokenAmounts = args.collateralTokens.map(token => Math.floor(token.amount * 100000000)); // 转换精度
      
      const transaction = await (window as any).aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::create_oath_with_collateral`,
          functionArguments: [
            args.content,
            args.description,
            args.category,
            args.endTime,
            tokenAddresses,
            tokenAmounts,
          ]
        }
      });

      const response = await (window as any).aptos.signAndSubmitTransaction({
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
      console.error('Failed to create oath with collateral:', error);
      throw error;
    }
  }

  async stakeCollateral(
    account: any,
    args: StakeCollateralArgs
  ): Promise<AptosTransactionResponse> {
    try {
      const transaction = await (window as any).aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::stake_collateral`,
          functionArguments: [
            args.oath_id,
            args.token_address,
            Math.floor(args.amount * 100000000) // 转换精度
          ]
        }
      });

      const response = await (window as any).aptos.signAndSubmitTransaction({
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
      console.error('Failed to stake collateral:', error);
      throw error;
    }
  }

  async getOath(args: ViewOathArgs) {
    try {
      const result = await (window as any).aptos.view({
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

  /**
 * 获取用户的所有 Oath 列表
 */
async getAllOaths(ownerAddress: string) {
  console.log("ownerAddress", ownerAddress)
  try {
  const result = await aptos.view({
    payload: {
      function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::get_all_oaths`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });
  console.log("result", result)

  return result;
  } catch (error) {
    console.error('Failed to get all oaths:', error);
    throw error;
  }

  }

  async completeOathAndMintSBT(
    account: any, 
    oathId: number, 
    completionTime: number
  ): Promise<AptosTransactionResponse> {
    try {
      const transaction = await (window as any).aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${OATH_CONTRACT_CONFIG.contractAddress}::${OATH_CONTRACT_CONFIG.moduleName}::complete_oath_and_mint_sbt`,
          functionArguments: [oathId, completionTime]
        }
      });

      const response = await (window as any).aptos.signAndSubmitTransaction({
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
      const result = await (window as any).aptos.view({
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
      const resources = await (window as any).aptos.getAccountResources({ accountAddress: address });
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