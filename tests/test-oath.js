/**
 * 命令行测试 Oath 合约调用
 */

const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

// 合约配置
const CONTRACT_ADDRESS = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
const MODULE_NAME = "oath_vault_v7";

// 初始化 Aptos 客户端
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

/**
 * 创建带有详细抵押代币信息的誓言
 */
async function createOathWithTokens(account, params) {
  console.log("🚀 开始创建 Oath...");
  console.log("参数:", JSON.stringify(params, null, 2));
  
  // 提取抵押代币的各个字段
  const tokenSymbols = params.collateralTokens.map(token => token.symbol);
  const tokenAmounts = params.collateralTokens.map(token => token.amount);
  const tokenAddresses = params.collateralTokens.map(token => token.address);
  const tokenUsdValues = params.collateralTokens.map(token => token.usdValue);

  console.log("代币符号:", tokenSymbols);
  console.log("代币数量:", tokenAmounts);
  console.log("代币地址:", tokenAddresses);
  console.log("代币USD价值:", tokenUsdValues);

  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_oath_with_tokens`,
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

  console.log("📝 提交交易...");
  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  console.log("⏳ 等待交易确认...");
  return await aptos.waitForTransaction({
    transactionHash: committedTxn.hash,
  });
}

/**
 * 获取誓言数量
 */
async function getOathCount(ownerAddress) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_oath_count`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });

  return parseInt(result[0]);
}

/**
 * 获取誓言详情
 */
async function getOath(ownerAddress, oathId) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_oath`,
      typeArguments: [],
      functionArguments: [ownerAddress, oathId],
    },
  });

  return result;
}

/**
 * 主测试函数
 */
async function testCreateOath() {
  try {
    console.log("🧪 开始测试 Oath 合约...");
    console.log("合约地址:", CONTRACT_ADDRESS);
    console.log("网络: Testnet");

    // 注意：这里使用测试用的私钥，实际使用时请替换
    // 你可以使用你在前面测试时使用的私钥
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY || "0x..."; // 需要替换为实际私钥
    
    if (privateKeyHex === "0x...") {
      console.log("❌ 请设置环境变量 APTOS_PRIVATE_KEY 或直接在代码中提供私钥");
      console.log("可以使用之前成功测试的账户私钥");
      return;
    }

    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log("账户地址:", account.accountAddress.toString());

    // 查询当前 Oath 数量
    console.log("\n📊 查询当前 Oath 数量...");
    const initialCount = await getOathCount(account.accountAddress.toString());
    console.log("当前 Oath 数量:", initialCount);

    // 测试用例 1: APY 保证
    console.log("\n🎯 测试用例 1: APY 保证誓言");
    const apyParams = {
      content: "命令行测试：APY保证30天内最低12%年化收益",
      description: "通过命令行Node.js脚本创建的测试誓言",
      category: "APY Guarantee",
      collateralAmount: 100000,
      endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30天后
      vaultAddress: "0xvault1234567890abcdef",
      targetAPY: 1200, // 12%
      categoryId: "apy-guarantee-cli-test",
      collateralTokens: [
        { symbol: "USDC", amount: 80000, address: "0xusdc", usdValue: 80000 },
        { symbol: "APT", amount: 2500, address: "0xapt", usdValue: 20000 }
      ]
    };

    const result1 = await createOathWithTokens(account, apyParams);
    console.log("✅ APY 誓言创建成功!");
    console.log("交易哈希:", result1.hash);
    console.log("区块链浏览器:", `https://explorer.aptoslabs.com/txn/${result1.hash}?network=testnet`);

    // 测试用例 2: TVL 增长
    console.log("\n📈 测试用例 2: TVL 增长承诺");
    const tvlParams = {
      content: "命令行测试：TVL增长承诺90天内增长50%",
      description: "通过命令行Node.js脚本创建的TVL增长测试誓言",
      category: "TVL Growth",
      collateralAmount: 250000,
      endTime: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90天后
      vaultAddress: "0xvault2345678901bcdef",
      targetAPY: 0, // 无APY要求
      categoryId: "tvl-growth-cli-test",
      collateralTokens: [
        { symbol: "USDC", amount: 150000, address: "0xusdc", usdValue: 150000 },
        { symbol: "APT", amount: 12500, address: "0xapt", usdValue: 100000 }
      ]
    };

    const result2 = await createOathWithTokens(account, tvlParams);
    console.log("✅ TVL 誓言创建成功!");
    console.log("交易哈希:", result2.hash);
    console.log("区块链浏览器:", `https://explorer.aptoslabs.com/txn/${result2.hash}?network=testnet`);

    // 验证结果
    console.log("\n🔍 验证创建结果...");
    const finalCount = await getOathCount(account.accountAddress.toString());
    console.log("更新后的 Oath 数量:", finalCount);
    console.log("新增数量:", finalCount - initialCount);

    // 查询最新创建的誓言详情
    if (finalCount > initialCount) {
      console.log("\n📋 查询最新创建的誓言详情...");
      const latestOath = await getOath(account.accountAddress.toString(), finalCount);
      console.log("最新誓言详情:");
      console.log(JSON.stringify(latestOath, null, 2));
    }

    console.log("\n🎉 命令行测试完成!");
    console.log("总结:");
    console.log(`- 创建了 ${finalCount - initialCount} 个新誓言`);
    console.log(`- APY 誓言交易: ${result1.hash}`);
    console.log(`- TVL 誓言交易: ${result2.hash}`);

  } catch (error) {
    console.error("❌ 测试失败:", error);
    if (error.message) {
      console.error("错误信息:", error.message);
    }
    if (error.stack) {
      console.error("错误堆栈:", error.stack);
    }
  }
}

/**
 * 简单查询测试（不需要私钥）
 */
async function testQuery() {
  try {
    console.log("🔍 测试查询功能...");
    
    // 使用之前测试成功的地址
    const testAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
    
    const count = await getOathCount(testAddress);
    console.log(`地址 ${testAddress} 的 Oath 数量: ${count}`);

    if (count > 0) {
      console.log("\n查询最后几个 Oath 的详情:");
      for (let i = Math.max(1, count - 2); i <= count; i++) {
        console.log(`\n--- Oath #${i} ---`);
        const oath = await getOath(testAddress, i);
        console.log(JSON.stringify(oath, null, 2));
      }
    }

    console.log("✅ 查询测试完成!");
  } catch (error) {
    console.error("❌ 查询测试失败:", error);
  }
}

// 根据命令行参数决定运行哪个测试
const args = process.argv.slice(2);
if (args.includes('--query-only')) {
  testQuery();
} else {
  testCreateOath();
}