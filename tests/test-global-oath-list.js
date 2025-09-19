/**
 * 测试全局 Oath 列表查询功能
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
 * 获取全局 Oath 记录总数
 */
async function getGlobalOathCount() {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_global_oath_count`,
      typeArguments: [],
      functionArguments: [],
    },
  });

  return parseInt(result[0]);
}

/**
 * 获取全局 Oath 记录列表（分页）
 */
async function getGlobalOathRecords(startId, limit) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_global_oath_records`,
      typeArguments: [],
      functionArguments: [startId, limit],
    },
  });

  return result[0];
}

/**
 * 根据全局 ID 获取 Oath 数据
 */
async function getOathByGlobalId(globalId) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_by_global_id`,
      typeArguments: [],
      functionArguments: [globalId],
    },
  });

  return result[0];
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
 * 测试全局 Oath 列表功能
 */
async function testGlobalOathList() {
  console.log("🚀 开始测试全局 Oath 列表功能");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);
  console.log("=".repeat(50));

  try {
    // 1. 查询当前全局 Oath 总数
    console.log("\n📊 查询全局 Oath 总数...");
    const totalCount = await getGlobalOathCount();
    console.log(`全局 Oath 总数: ${totalCount}`);

    if (totalCount === 0) {
      console.log("⚠️  没有找到全局 Oath 记录");
      console.log("💡 可能需要先创建一些 Oath 或者全局注册表没有正确初始化");
      return;
    }

    // 2. 获取全局 Oath 记录列表（分页查询）
    console.log("\n📋 获取全局 Oath 记录列表...");
    const pageSize = 10;
    const startId = 1;
    
    console.log(`查询参数: startId=${startId}, limit=${pageSize}`);
    const records = await getGlobalOathRecords(startId, pageSize);
    console.log(`获取到 ${records.length} 条记录`);

    // 3. 显示记录详情
    if (records.length > 0) {
      console.log("\n📋 全局 Oath 记录详情:");
      console.log("-".repeat(80));
      
      for (let i = 0; i < Math.min(records.length, 5); i++) {
        const record = records[i];
        console.log(`\n📝 记录 #${i + 1}:`);
        console.log(`  全局 ID: ${record.global_id}`);
        console.log(`  所有者: ${record.owner}`);
        console.log(`  本地 ID: ${record.local_id}`);
        console.log(`  创建时间: ${new Date(parseInt(record.created_at) * 1000).toLocaleString()}`);

        // 4. 根据全局 ID 获取具体的 Oath 数据
        console.log(`\n🔍 查询全局 ID ${record.global_id} 的 Oath 详情...`);
        const oathResult = await getOathByGlobalId(record.global_id);
        
        if (oathResult.vec && oathResult.vec.length > 0) {
          const oath = oathResult.vec[0];
          console.log(`  ✅ Oath 详情:`);
          console.log(`    - ID: ${oath.id}`);
          console.log(`    - 内容: ${oath.content}`);
          console.log(`    - 分类: ${oath.category} (${oath.category_id})`);
          console.log(`    - 抵押总额: $${oath.stable_collateral}`);
          console.log(`    - 状态: ${oath.status} (1=Active)`);
          
          if (oath.target_apy.vec.length > 0) {
            console.log(`    - 目标 APY: ${parseInt(oath.target_apy.vec[0]) / 100}%`);
          }
          
          if (oath.collateral_tokens.length > 0) {
            console.log(`    - 抵押代币:`);
            oath.collateral_tokens.forEach((token, index) => {
              console.log(`      ${index + 1}. ${token.symbol}: ${token.amount} (${token.address}) = $${token.usd_value}`);
            });
          }
        } else {
          console.log(`  ❌ 未找到全局 ID ${record.global_id} 对应的 Oath 数据`);
        }
      }

      // 5. 分页查询测试
      if (totalCount > pageSize) {
        console.log("\n📄 测试分页查询...");
        const secondPageRecords = await getGlobalOathRecords(pageSize + 1, pageSize);
        console.log(`第二页获取到 ${secondPageRecords.length} 条记录`);
      }

    } else {
      console.log("❌ 没有获取到任何全局 Oath 记录");
    }

    console.log("\n🎉 全局 Oath 列表功能测试完成!");
    
    return {
      totalCount,
      recordsCount: records.length,
      success: true
    };

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    throw error;
  }
}

/**
 * 创建测试 Oath（如果需要）
 */
async function createTestOaths() {
  console.log("🚀 创建测试 Oath...");
  
  const privateKeyHex = process.env.APTOS_PRIVATE_KEY;
  if (!privateKeyHex) {
    console.log("❌ 请设置环境变量 APTOS_PRIVATE_KEY");
    return;
  }

  const cleanPrivateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
  const privateKey = new Ed25519PrivateKey(cleanPrivateKey);
  const account = Account.fromPrivateKey({ privateKey });
  
  const testOath = {
    content: `全局测试 Oath - ${new Date().toISOString()}`,
    description: "测试全局 Oath 列表功能",
    category: "Test Category", 
    collateralAmount: 50000,
    endTime: createFutureTimestamp(15),
    vaultAddress: "0xtestVault123",
    targetAPY: 800,
    categoryId: "test-category",
    collateralTokens: [
      new CollateralTokenInput("TEST", 50000, "0xtest", 50000)
    ]
  };

  const result = await createOathWithTokens(account, testOath);
  console.log("✅ 测试 Oath 创建成功!");
  console.log("交易哈希:", result.hash);
  
  return result;
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--create-test')) {
  // 创建测试 Oath
  createTestOaths().then(() => {
    console.log("✅ 测试 Oath 创建完成，现在可以测试列表功能");
  }).catch(error => {
    console.error("❌ 创建测试 Oath 失败:", error);
  });
} else {
  // 测试全局列表功能
  testGlobalOathList().catch(error => {
    console.error("测试失败:", error);
    process.exit(1);
  });
}