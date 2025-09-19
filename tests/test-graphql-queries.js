/**
 * 使用 GraphQL 查询 Oath 数据示例
 */

const { AptosConfig, Network, Aptos } = require("@aptos-labs/ts-sdk");

// 合约配置
const CONTRACT_CONFIG = {
  address: "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
  module: "oath_vault_v7",
  network: Network.TESTNET
};

// GraphQL 端点
const GRAPHQL_ENDPOINTS = {
  [Network.TESTNET]: "https://api.testnet.aptoslabs.com/v1/graphql",
  [Network.MAINNET]: "https://api.mainnet.aptoslabs.com/v1/graphql",
  [Network.DEVNET]: "https://api.devnet.aptoslabs.com/v1/graphql"
};

/**
 * GraphQL 查询工具类
 */
class AptosGraphQLClient {
  constructor(network = Network.TESTNET) {
    this.endpoint = GRAPHQL_ENDPOINTS[network];
    this.network = network;
  }

  /**
   * 执行 GraphQL 查询
   */
  async query(query, variables = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL 查询错误: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * 查询账户资源
   */
  async getAccountResources(address) {
    const query = `
      query GetAccountResources($address: String!) {
        account_transactions(
          where: {account_address: {_eq: $address}}
          limit: 10
          order_by: {transaction_version: desc}
        ) {
          account_address
          transaction_version
          user_transaction {
            sender
            payload
            success
            vm_status
            gas_used
            timestamp
          }
        }
      }
    `;

    return this.query(query, { address });
  }

  /**
   * 查询特定类型的账户资源
   */
  async getAccountResource(address, resourceType) {
    // GraphQL 不直接支持查询特定资源类型，我们通过交易来推断
    const query = `
      query GetAccountResource($address: String!) {
        account_transactions(
          where: {
            account_address: {_eq: $address}
          }
          limit: 20
          order_by: {transaction_version: desc}
        ) {
          account_address
          transaction_version
          user_transaction {
            sender
            payload
            success
            vm_status
            gas_used
            timestamp
            events {
              type
              data
            }
          }
        }
      }
    `;

    return this.query(query, { address });
  }

  /**
   * 查询 Move 事件
   */
  async getEvents(eventType, limit = 10, offset = 0) {
    const query = `
      query GetEvents($event_type: String!, $limit: Int!, $offset: Int!) {
        events(
          where: {type: {_eq: $event_type}}
          limit: $limit
          offset: $offset
          order_by: {sequence_number: desc}
        ) {
          account_address
          creation_number
          data
          sequence_number
          transaction_version
          type
          indexed_type
          transaction_block_height
        }
      }
    `;

    return this.query(query, { 
      event_type: eventType, 
      limit, 
      offset 
    });
  }

  /**
   * 查询交易历史
   */
  async getTransactions(address, limit = 10, offset = 0) {
    const query = `
      query GetTransactions($address: String!, $limit: Int!, $offset: Int!) {
        account_transactions(
          where: {account_address: {_eq: $address}}
          limit: $limit
          offset: $offset
          order_by: {transaction_version: desc}
        ) {
          account_address
          transaction_version
          user_transaction {
            sender
            sequence_number
            max_gas_amount
            gas_unit_price
            payload
            success
            vm_status
            gas_used
            timestamp
            events {
              data
              type
            }
          }
        }
      }
    `;

    return this.query(query, { 
      address, 
      limit, 
      offset 
    });
  }

  /**
   * 查询模块和函数调用
   */
  async getModuleFunctionCalls(moduleAddress, moduleName, functionName, limit = 10) {
    const query = `
      query GetModuleFunctionCalls($limit: Int!) {
        user_transactions(
          limit: $limit
          order_by: {version: desc}
        ) {
          version
          sender
          payload
          success
          vm_status
          gas_used
          timestamp
          events {
            data
            type
          }
        }
      }
    `;
    
    return this.query(query, { limit });
  }

  /**
   * 查询特定账户的 Oath 相关交易
   */
  async getOathTransactions(userAddress, limit = 20) {
    const query = `
      query GetOathTransactions($user_address: String!, $limit: Int!) {
        user_transactions(
          where: {sender: {_eq: $user_address}}
          limit: $limit
          order_by: {version: desc}
        ) {
          version
          sender
          payload
          success
          vm_status
          gas_used
          timestamp
          events {
            data
            type
          }
        }
      }
    `;

    return this.query(query, { 
      user_address: userAddress,
      limit 
    });
  }

  /**
   * 查询 Oath 创建事件
   */
  async getOathCreationEvents(limit = 50) {
    // 注意：实际的事件类型需要根据合约定义调整
    const eventType = `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::OathCreated`;
    
    const query = `
      query GetOathCreationEvents($event_type: String!, $limit: Int!) {
        events(
          where: {type: {_eq: $event_type}}
          limit: $limit
          order_by: {sequence_number: desc}
        ) {
          account_address
          data
          sequence_number
          transaction_version
          transaction_block_height
          indexed_type
        }
      }
    `;

    return this.query(query, { 
      event_type: eventType,
      limit 
    });
  }
}

/**
 * 测试 GraphQL 查询功能
 */
async function testGraphQLQueries() {
  console.log("🚀 开始测试 GraphQL 查询功能");
  console.log("=".repeat(50));

  const client = new AptosGraphQLClient(CONTRACT_CONFIG.network);
  const testAddress = "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c";

  try {
    // 1. 查询账户交易
    console.log("\n📊 1. 查询账户交易...");
    const transactions = await client.getAccountResources(testAddress);
    console.log(`找到账户交易数据:`, transactions.account_transactions?.length || 0);

    // 2. 显示最近的交易
    console.log("\n📊 2. 最近的交易详情...");
    if (transactions.account_transactions?.length > 0) {
      const recentTx = transactions.account_transactions[0];
      console.log("✅ 最近交易信息:");
      console.log(`  - 版本: ${recentTx.transaction_version}`);
      console.log(`  - 发送者: ${recentTx.user_transaction?.sender || 'N/A'}`);
      console.log(`  - 成功: ${recentTx.user_transaction?.success || 'N/A'}`);
      console.log(`  - Gas 使用: ${recentTx.user_transaction?.gas_used || 'N/A'}`);
      console.log(`  - 时间: ${recentTx.user_transaction?.timestamp || 'N/A'}`);
      
      if (recentTx.user_transaction?.payload) {
        console.log(`  - 函数: ${recentTx.user_transaction.payload.function || 'N/A'}`);
      }
    } else {
      console.log("❌ 未找到账户交易");
    }

    // 3. 查询用户的 Oath 相关交易
    console.log("\n📊 3. 查询 Oath 相关交易...");
    const oathTransactions = await client.getOathTransactions(testAddress, 10);
    console.log(`找到 ${oathTransactions.user_transactions?.length || 0} 个用户交易`);
    
    if (oathTransactions.user_transactions?.length > 0) {
      // 过滤出 Oath 相关的交易
      const oathRelatedTxs = oathTransactions.user_transactions.filter(tx => 
        tx.payload?.function?.includes('oath_vault_v7') || 
        tx.payload?.function?.includes('create_oath')
      );
      
      console.log(`其中 ${oathRelatedTxs.length} 个是 Oath 相关交易`);
      
      oathRelatedTxs.slice(0, 3).forEach((tx, index) => {
        console.log(`\nOath 交易 #${index + 1}:`);
        console.log(`  - 版本: ${tx.version}`);
        console.log(`  - 成功: ${tx.success}`);
        console.log(`  - Gas 使用: ${tx.gas_used}`);
        console.log(`  - 时间: ${tx.timestamp}`);
        console.log(`  - 函数: ${tx.payload?.function || 'N/A'}`);
        
        if (tx.events?.length > 0) {
          console.log(`  - 事件数量: ${tx.events.length}`);
        }
      });
    }

    // 4. 查询模块函数调用
    console.log("\n📊 4. 查询最近的函数调用...");
    const functionCalls = await client.getModuleFunctionCalls(
      CONTRACT_CONFIG.address,
      CONTRACT_CONFIG.module,
      "create_oath_with_tokens",
      10
    );
    
    console.log(`找到 ${functionCalls.user_transactions?.length || 0} 个最近的交易`);
    
    // 过滤出我们合约的交易
    if (functionCalls.user_transactions?.length > 0) {
      const contractTxs = functionCalls.user_transactions.filter(tx => 
        tx.payload?.function?.includes(CONTRACT_CONFIG.address)
      );
      
      console.log(`其中 ${contractTxs.length} 个是我们合约的交易`);
      
      contractTxs.slice(0, 2).forEach((tx, index) => {
        console.log(`\n合约交易 #${index + 1}:`);
        console.log(`  - 版本: ${tx.version}`);
        console.log(`  - 发送者: ${tx.sender}`);
        console.log(`  - 成功: ${tx.success}`);
        console.log(`  - 函数: ${tx.payload?.function}`);
      });
    }

    // 5. 查询事件（如果有定义的话）
    console.log("\n📊 5. 尝试查询 Oath 创建事件...");
    try {
      const creationEvents = await client.getOathCreationEvents(10);
      console.log(`找到 ${creationEvents.events?.length || 0} 个创建事件`);
    } catch (error) {
      console.log("ℹ️  没有找到 Oath 创建事件（可能事件类型不存在）");
    }

    console.log("\n🎉 GraphQL 查询测试完成!");

  } catch (error) {
    console.error("❌ GraphQL 查询测试失败:", error.message);
    throw error;
  }
}

/**
 * 比较 GraphQL 和 View 函数的性能
 */
async function compareGraphQLvsViewFunctions() {
  console.log("\n🔄 比较 GraphQL 查询 vs View 函数性能");
  console.log("=".repeat(50));

  const graphqlClient = new AptosGraphQLClient(CONTRACT_CONFIG.network);
  const config = new AptosConfig({ network: CONTRACT_CONFIG.network });
  const aptos = new Aptos(config);
  
  const testAddress = "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c";

  try {
    // GraphQL 查询时间测试
    console.log("\n⏱️  GraphQL 查询账户资源...");
    const graphqlStart = Date.now();
    await graphqlClient.getAccountResources(testAddress);
    const graphqlTime = Date.now() - graphqlStart;
    console.log(`GraphQL 查询耗时: ${graphqlTime}ms`);

    // View 函数调用时间测试
    console.log("\n⏱️  View 函数查询 Oath 数量...");
    const viewStart = Date.now();
    await aptos.view({
      payload: {
        function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count`,
        typeArguments: [],
        functionArguments: [testAddress],
      },
    });
    const viewTime = Date.now() - viewStart;
    console.log(`View 函数查询耗时: ${viewTime}ms`);

    console.log(`\n📈 性能比较:`);
    console.log(`  - GraphQL: ${graphqlTime}ms`);
    console.log(`  - View 函数: ${viewTime}ms`);
    console.log(`  - 差异: ${Math.abs(graphqlTime - viewTime)}ms`);

  } catch (error) {
    console.error("❌ 性能比较测试失败:", error.message);
  }
}

// 运行测试
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--compare')) {
    compareGraphQLvsViewFunctions().catch(console.error);
  } else {
    testGraphQLQueries().catch(console.error);
  }
}

module.exports = {
  AptosGraphQLClient,
  CONTRACT_CONFIG,
  testGraphQLQueries,
  compareGraphQLvsViewFunctions
};