/**
 * 简化的 Aptos GraphQL 查询示例
 * 基于实际可用的 schema
 */

const { Network } = require("@aptos-labs/ts-sdk");

const GRAPHQL_ENDPOINT = "https://api.testnet.aptoslabs.com/v1/graphql";

/**
 * 简化的 GraphQL 客户端
 */
class SimpleGraphQLClient {
  async query(query, variables = {}) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
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
   * 查询用户交易
   */
  async getUserTransactions(address, limit = 10) {
    const query = `
      query GetUserTransactions($sender: String!, $limit: Int!) {
        user_transactions(
          where: {sender: {_eq: $sender}}
          limit: $limit
          order_by: {version: desc}
        ) {
          version
          sender
          entry_function_id_str
        }
      }
    `;

    return this.query(query, { sender: address, limit });
  }

  /**
   * 查询账户交易
   */
  async getAccountTransactions(address, limit = 10) {
    const query = `
      query GetAccountTransactions($address: String!, $limit: Int!) {
        account_transactions(
          where: {account_address: {_eq: $address}}
          limit: $limit
          order_by: {transaction_version: desc}
        ) {
          account_address
          transaction_version
        }
      }
    `;

    return this.query(query, { address, limit });
  }

  /**
   * 查询事件
   */
  async getEvents(limit = 10) {
    const query = `
      query GetEvents($limit: Int!) {
        events(
          limit: $limit
          order_by: {transaction_version: desc}
        ) {
          account_address
          type
          data
          transaction_version
        }
      }
    `;

    return this.query(query, { limit });
  }

  /**
   * 查询 Oath 相关的交易
   */
  async getOathTransactions(address, limit = 20) {
    const query = `
      query GetOathTransactions($sender: String!, $limit: Int!) {
        user_transactions(
          where: {
            sender: {_eq: $sender}
            entry_function_id_str: {_like: "%oath_vault_v7%"}
          }
          limit: $limit
          order_by: {version: desc}
        ) {
          version
          sender
          entry_function_id_str
        }
      }
    `;

    return this.query(query, { sender: address, limit });
  }

  /**
   * 查询所有包含特定合约地址的交易
   */
  async getContractTransactions(contractAddress, limit = 50) {
    const query = `
      query GetContractTransactions($contract: String!, $limit: Int!) {
        user_transactions(
          where: {
            entry_function_id_str: {_like: $contract}
          }
          limit: $limit
          order_by: {version: desc}
        ) {
          version
          sender
          entry_function_id_str
        }
      }
    `;

    return this.query(query, { 
      contract: `%${contractAddress}%`, 
      limit 
    });
  }

  /**
   * 统计用户交易数量（简化版本）
   */
  async getUserTransactionCount(address) {
    // 由于 aggregate 函数不可用，我们使用基础查询然后计算长度
    const query = `
      query GetUserTransactionCount($sender: String!) {
        user_transactions(
          where: {sender: {_eq: $sender}}
          limit: 1000
        ) {
          version
        }
      }
    `;

    const result = await this.query(query, { sender: address });
    return {
      user_transactions: result.user_transactions || [],
      count: result.user_transactions?.length || 0
    };
  }
}

/**
 * 测试 GraphQL 查询功能
 */
async function testGraphQL() {
  console.log("🚀 开始测试简化的 GraphQL 查询");
  console.log("=".repeat(50));

  const client = new SimpleGraphQLClient();
  const testAddress = "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c";
  const contractAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";

  try {
    // 1. 查询用户交易
    console.log("\n📊 1. 查询用户交易...");
    const userTxs = await client.getUserTransactions(testAddress, 5);
    console.log(`找到 ${userTxs.user_transactions?.length || 0} 个用户交易`);
    
    if (userTxs.user_transactions?.length > 0) {
      userTxs.user_transactions.forEach((tx, index) => {
        console.log(`  交易 #${index + 1}: ${tx.version} - ${tx.entry_function_id_str || 'N/A'}`);
      });
    }

    // 2. 查询账户交易
    console.log("\n📊 2. 查询账户交易...");
    const accountTxs = await client.getAccountTransactions(testAddress, 5);
    console.log(`找到 ${accountTxs.account_transactions?.length || 0} 个账户交易`);
    
    if (accountTxs.account_transactions?.length > 0) {
      accountTxs.account_transactions.forEach((tx, index) => {
        console.log(`  交易 #${index + 1}: 版本 ${tx.transaction_version}`);
      });
    }

    // 3. 查询 Oath 相关交易
    console.log("\n📊 3. 查询 Oath 相关交易...");
    const oathTxs = await client.getOathTransactions(testAddress, 10);
    console.log(`找到 ${oathTxs.user_transactions?.length || 0} 个 Oath 相关交易`);
    
    if (oathTxs.user_transactions?.length > 0) {
      oathTxs.user_transactions.forEach((tx, index) => {
        console.log(`  Oath 交易 #${index + 1}: ${tx.version} - ${tx.entry_function_id_str}`);
      });
    }

    // 4. 查询合约交易
    console.log("\n📊 4. 查询合约相关的所有交易...");
    const contractTxs = await client.getContractTransactions(contractAddress, 10);
    console.log(`找到 ${contractTxs.user_transactions?.length || 0} 个合约交易`);
    
    if (contractTxs.user_transactions?.length > 0) {
      contractTxs.user_transactions.slice(0, 3).forEach((tx, index) => {
        console.log(`  合约交易 #${index + 1}:`);
        console.log(`    版本: ${tx.version}`);
        console.log(`    发送者: ${tx.sender}`);
        console.log(`    函数: ${tx.entry_function_id_str}`);
      });
    }

    // 5. 统计用户交易数量
    console.log("\n📊 5. 统计用户交易数量...");
    const txCountResult = await client.getUserTransactionCount(testAddress);
    const count = txCountResult.count || 0;
    console.log(`用户总交易数量: ${count}`);

    // 6. 查询最近的事件
    console.log("\n📊 6. 查询最近的事件...");
    const events = await client.getEvents(3);
    console.log(`找到 ${events.events?.length || 0} 个最近事件`);
    
    if (events.events?.length > 0) {
      events.events.forEach((event, index) => {
        console.log(`  事件 #${index + 1}:`);
        console.log(`    类型: ${event.type}`);
        console.log(`    账户: ${event.account_address}`);
        console.log(`    交易版本: ${event.transaction_version}`);
      });
    }

    console.log("\n🎉 GraphQL 查询测试完成!");

    return {
      userTransactions: userTxs.user_transactions?.length || 0,
      accountTransactions: accountTxs.account_transactions?.length || 0,
      oathTransactions: oathTxs.user_transactions?.length || 0,
      contractTransactions: contractTxs.user_transactions?.length || 0,
      totalTransactions: count,
      success: true
    };

  } catch (error) {
    console.error("❌ GraphQL 查询测试失败:", error.message);
    throw error;
  }
}

/**
 * 创建一个 GraphQL 和 View 函数的性能对比
 */
async function comparePerformance() {
  console.log("\n🔄 GraphQL vs View 函数性能对比");
  console.log("=".repeat(50));

  const { Aptos, AptosConfig } = require("@aptos-labs/ts-sdk");
  
  const client = new SimpleGraphQLClient();
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
  
  const testAddress = "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c";
  const contractAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";

  try {
    // GraphQL 查询性能测试
    console.log("\n⏱️  GraphQL 查询用户交易...");
    const graphqlStart = Date.now();
    await client.getUserTransactions(testAddress, 10);
    const graphqlTime = Date.now() - graphqlStart;
    console.log(`GraphQL 查询耗时: ${graphqlTime}ms`);

    // View 函数性能测试
    console.log("\n⏱️  View 函数查询 Oath 数量...");
    const viewStart = Date.now();
    await aptos.view({
      payload: {
        function: `${contractAddress}::oath_vault_v7::get_oath_count`,
        typeArguments: [],
        functionArguments: [testAddress],
      },
    });
    const viewTime = Date.now() - viewStart;
    console.log(`View 函数查询耗时: ${viewTime}ms`);

    // 统计分析
    console.log(`\n📈 性能对比结果:`);
    console.log(`  - GraphQL 查询: ${graphqlTime}ms`);
    console.log(`  - View 函数调用: ${viewTime}ms`);
    console.log(`  - 速度差异: ${Math.abs(graphqlTime - viewTime)}ms`);
    
    if (graphqlTime < viewTime) {
      console.log(`  - GraphQL 快 ${((viewTime - graphqlTime) / viewTime * 100).toFixed(1)}%`);
    } else {
      console.log(`  - View 函数快 ${((graphqlTime - viewTime) / graphqlTime * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error("❌ 性能对比测试失败:", error.message);
  }
}

/**
 * GraphQL 使用总结
 */
function printGraphQLSummary() {
  console.log("\n📋 Aptos GraphQL 使用总结");
  console.log("=".repeat(50));
  console.log(`
🔍 GraphQL 的优势:
  ✅ 灵活的数据查询 - 可以精确指定需要的字段
  ✅ 单一请求获取多种数据 - 减少网络请求次数
  ✅ 历史数据查询 - 可以查询交易历史和事件
  ✅ 聚合和统计 - 支持 count、sum 等聚合操作
  ✅ 分页和排序 - 内置分页和排序功能

🎯 GraphQL 的适用场景:
  📊 数据分析和统计
  📈 交易历史查询
  🔍 事件监控和查询
  📱 前端展示复杂的历史数据
  📋 生成报表和仪表板

⚠️  GraphQL 的限制:
  ❌ 不能直接查询合约状态
  ❌ 只能查询历史数据，不能查询实时状态
  ❌ Schema 可能会变化，需要适配
  ❌ 复杂查询可能有性能限制

🔧 推荐的使用策略:
  🎯 实时数据查询 → 使用 View 函数
  📊 历史数据分析 → 使用 GraphQL
  💰 交易费用考虑 → GraphQL 不消耗 Gas
  🚀 开发效率 → 结合使用两种方式

📚 可用的主要查询表:
  - user_transactions: 用户交易数据
  - account_transactions: 账户交易关联
  - events: 区块链事件
  - user_transactions_aggregate: 交易统计
  - account_transactions_aggregate: 账户统计
  `);
}

// 运行测试
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--compare')) {
    comparePerformance().catch(console.error);
  } else if (args.includes('--summary')) {
    printGraphQLSummary();
  } else {
    testGraphQL()
      .then(() => {
        printGraphQLSummary();
      })
      .catch(console.error);
  }
}

module.exports = {
  SimpleGraphQLClient,
  testGraphQL,
  comparePerformance,
  printGraphQLSummary
};