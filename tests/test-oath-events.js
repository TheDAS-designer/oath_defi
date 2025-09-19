/**
 * 测试 Oath 创建事件功能
 */

const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

// 合约配置
const CONTRACT_CONFIG = {
  address: "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
  module: "oath_vault_v7",
  network: Network.TESTNET
};

// 初始化 Aptos 客户端
const config = new AptosConfig({ network: CONTRACT_CONFIG.network });
const aptos = new Aptos(config);

/**
 * 抵押代币接口
 */
class CollateralTokenInput {
  constructor(symbol, amount, address, usdValue) {
    this.symbol = symbol;
    this.amount = amount;
    this.address = address;
    this.usdValue = usdValue;
  }
}

/**
 * 创建带有详细抵押代币信息的誓言
 */
async function createOathWithTokens(account, params) {
  
  // 提取抵押代币的各个字段
  const tokenSymbols = params.collateralTokens.map(token => token.symbol);
  const tokenAmounts = params.collateralTokens.map(token => token.amount);
  const tokenAddresses = params.collateralTokens.map(token => token.address);
  const tokenUsdValues = params.collateralTokens.map(token => token.usdValue);

  console.log("Creating oath with tokens:", {
    content: params.content,
    description: params.description,
    category: params.category,
    collateralAmount: params.collateralAmount,
    endTime: params.endTime,
    vaultAddress: params.vaultAddress,
    targetAPY: params.targetAPY,
    categoryId: params.categoryId,
    tokenSymbols,
    tokenAmounts,
    tokenAddresses,
    tokenUsdValues
  });

  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::create_oath_with_tokens`,
      typeArguments: [],
      functionArguments: [
        params.content,           // string: 誓言内容
        params.description,       // string: 描述
        params.category,          // string: 分类
        params.collateralAmount,  // u64: 总抵押价值
        params.endTime,           // u64: 结束时间
        params.vaultAddress,      // string: Vault 地址
        params.targetAPY,         // u64: 目标 APY
        params.categoryId,        // string: 分类 ID
        tokenSymbols,             // vector<string>: 代币符号
        tokenAmounts,             // vector<u64>: 代币数量
        tokenAddresses,           // vector<string>: 代币地址
        tokenUsdValues,           // vector<u64>: 代币USD价值
      ],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  return await aptos.waitForTransaction({
    transactionHash: committedTxn.hash,
  });
}

/**
 * 从交易结果中提取事件
 */
function extractEventsFromTransaction(transactionResult) {
  const events = [];
  
  if (transactionResult.events) {
    transactionResult.events.forEach(event => {
      console.log(`\n🎉 检测到事件:`);
      console.log(`  类型: ${event.type}`);
      console.log(`  数据:`, JSON.stringify(event.data, null, 2));
      events.push(event);
    });
  }
  
  return events;
}

/**
 * 使用 GraphQL 查询事件
 */
async function queryOathEventsWithGraphQL(contractAddress, limit = 10) {
  const endpoint = "https://api.testnet.aptoslabs.com/v1/graphql";
  
  // 构建事件类型查询
  const oathCreatedEventType = `${contractAddress}::oath_vault_v7::OathCreatedEvent`;
  
  const query = `
    query GetOathEvents($event_type: String!, $limit: Int!) {
      events(
        where: {type: {_eq: $event_type}}
        limit: $limit
        order_by: {transaction_version: desc}
      ) {
        account_address
        data
        sequence_number
        transaction_version
        type
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { 
          event_type: oathCreatedEventType,
          limit 
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL 查询错误:', result.errors);
      return [];
    }

    return result.data.events || [];
  } catch (error) {
    console.error('GraphQL 查询失败:', error);
    return [];
  }
}

/**
 * 辅助函数：创建未来的时间戳
 */
function createFutureTimestamp(daysFromNow) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  return Math.floor(futureDate.getTime() / 1000);
}

/**
 * 测试事件功能
 */
async function testEventFunctionality() {
  console.log("🚀 开始测试 Oath 事件功能");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);
  console.log("=".repeat(50));

  try {
    // 1. 查询现有的事件
    console.log("\n📊 1. 查询现有的 OathCreated 事件...");
    const existingEvents = await queryOathEventsWithGraphQL(CONTRACT_CONFIG.address, 5);
    console.log(`找到 ${existingEvents.length} 个现有事件`);
    
    if (existingEvents.length > 0) {
      console.log("\n最近的事件:");
      existingEvents.slice(0, 2).forEach((event, index) => {
        console.log(`\n事件 #${index + 1}:`);
        console.log(`  交易版本: ${event.transaction_version}`);
        console.log(`  账户地址: ${event.account_address}`);
        console.log(`  数据:`, JSON.stringify(event.data, null, 2));
      });
    }

    // 2. 创建新的 Oath 并观察事件
    console.log("\n🎯 2. 创建新的 Oath 测试事件...");
    
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY;
    if (!privateKeyHex) {
      console.log("❌ 请设置环境变量 APTOS_PRIVATE_KEY");
      return;
    }

    const cleanPrivateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
    const privateKey = new Ed25519PrivateKey(cleanPrivateKey);
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log("账户地址:", account.accountAddress.toString());

    const testOath = {
      content: `事件测试 Oath - ${new Date().toISOString()}`,
      description: "测试事件功能的 Oath",
      category: "Event Test Category", 
      collateralAmount: 75000,
      endTime: createFutureTimestamp(20),
      vaultAddress: "0xeventTestVault",
      targetAPY: 950,
      categoryId: "event-test-category",
      collateralTokens: [
        new CollateralTokenInput("EVENT", 30000, "0xevent", 30000),
        new CollateralTokenInput("TEST", 45000, "0xtest", 45000)
      ]
    };

    console.log("\n🚀 创建 Oath...");
    const transactionResult = await createOathWithTokens(account, testOath);
    
    console.log("✅ Oath 创建成功!");
    console.log("交易哈希:", transactionResult.hash);
    console.log("交易版本:", transactionResult.version);
    console.log("Gas 使用:", transactionResult.gas_used);
    console.log("区块链浏览器:", `https://explorer.aptoslabs.com/txn/${transactionResult.hash}?network=testnet`);

    // 3. 从交易结果中提取事件
    console.log("\n📋 3. 从交易结果中提取事件...");
    const events = extractEventsFromTransaction(transactionResult);
    
    if (events.length > 0) {
      events.forEach((event, index) => {
        if (event.type.includes("OathCreatedEvent")) {
          console.log(`\n🎉 OathCreated 事件详情 #${index + 1}:`);
          console.log(`  ✅ ID: ${event.data.id}`);
          console.log(`  ✅ 创建者: ${event.data.creator}`);
          console.log(`  ✅ 内容: ${event.data.content}`);
          console.log(`  ✅ 分类: ${event.data.category} (${event.data.category_id})`);
          console.log(`  ✅ 开始时间: ${new Date(parseInt(event.data.start_time) * 1000).toLocaleString()}`);
          console.log(`  ✅ 结束时间: ${new Date(parseInt(event.data.end_time) * 1000).toLocaleString()}`);
          console.log(`  ✅ 抵押总额: $${event.data.stable_collateral}`);
          console.log(`  ✅ 抵押代币数量: ${event.data.collateral_tokens_count}`);
          console.log(`  ✅ 过度抵押: ${event.data.is_over_collateralized}`);
          console.log(`  ✅ 关联 Vault: ${event.data.has_vault_address}`);
          
          if (event.data.target_apy && event.data.target_apy.vec && event.data.target_apy.vec.length > 0) {
            console.log(`  ✅ 目标 APY: ${parseInt(event.data.target_apy.vec[0]) / 100}%`);
          }
          
          console.log(`  ✅ 状态: ${event.data.status}`);
          console.log(`  ✅ 证据: ${event.data.evidence}`);
        }
      });
    } else {
      console.log("⚠️  交易结果中没有找到事件");
    }

    // 4. 等待一段时间，然后通过 GraphQL 查询新创建的事件
    console.log("\n📊 4. 等待 3 秒后通过 GraphQL 查询新事件...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newEvents = await queryOathEventsWithGraphQL(CONTRACT_CONFIG.address, 3);
    console.log(`通过 GraphQL 找到 ${newEvents.length} 个最新事件`);
    
    if (newEvents.length > 0) {
      const latestEvent = newEvents[0];
      console.log(`\n📋 最新事件（交易版本 ${latestEvent.transaction_version}）:`);
      console.log(JSON.stringify(latestEvent.data, null, 2));
    }

    console.log("\n🎉 事件功能测试完成!");
    
    return {
      transactionHash: transactionResult.hash,
      transactionVersion: transactionResult.version,
      eventsFromTransaction: events.length,
      eventsFromGraphQL: newEvents.length,
      success: true
    };

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testEventFunctionality().catch(error => {
    console.error("测试失败:", error);
    process.exit(1);
  });
}

module.exports = {
  testEventFunctionality,
  createOathWithTokens,
  extractEventsFromTransaction,
  queryOathEventsWithGraphQL
};