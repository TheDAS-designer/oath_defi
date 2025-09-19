/**
 * 测试 demonstrateOathCreation 函数
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
    ...params,
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
 * 获取指定誓言的详细信息
 */
async function getOath(ownerAddress, oathId) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath`,
      typeArguments: [],
      functionArguments: [ownerAddress, oathId],
    },
  });

  return result;
}

/**
 * 获取用户的誓言总数
 */
async function getOathCount(ownerAddress) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });

  return parseInt(result[0]);
}

/**
 * 完成誓言并铸造 SBT
 */
async function completeOathAndMintSBT(account, oathId, evidence) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::complete_oath_and_mint_sbt`,
      typeArguments: [],
      functionArguments: [oathId, evidence],
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
 * 预设的测试用例
 */
const TEST_CASES = {
  // 基于成功的 CLI 命令测试用例 1
  APY_GUARANTEE: {
    content: "APY保证：30天内最低12%年化收益",
    description: "为我的vault承诺最低12%APY表现",
    category: "APY Guarantee",
    collateralAmount: 100000,
    endTime: 1777747200,
    vaultAddress: "0xvault1234567890abcdef",
    targetAPY: 1200,
    categoryId: "apy-guarantee",
    collateralTokens: [
      new CollateralTokenInput("USDC", 80000, "0xusdc", 80000),
      new CollateralTokenInput("APT", 2500, "0xapt", 20000)
    ]
  },

  // 基于成功的 CLI 命令测试用例 2
  TVL_GROWTH: {
    content: "TVL Growth Promise: 50% increase in 90 days",
    description: "Commit to growing vault TVL by 50% over 90 days",
    category: "TVL Growth",
    collateralAmount: 250000,
    endTime: 1780339200,
    vaultAddress: "0xvault2345678901bcdef",
    targetAPY: 0,
    categoryId: "tvl-growth",
    collateralTokens: [
      new CollateralTokenInput("USDC", 150000, "0xusdc", 150000),
      new CollateralTokenInput("APT", 12500, "0xapt", 100000)
    ]
  }
};

/**
 * 辅助函数：创建未来的时间戳
 */
function createFutureTimestamp(daysFromNow) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  return Math.floor(futureDate.getTime() / 1000);
}

/**
 * 仅测试 createOathWithTokens 函数
 */
async function demonstrateOathCreation() {
  console.log("🚀 开始测试 createOathWithTokens 函数");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);

  try {
    // 1. 初始化账户 (实际应用中应该来自用户钱包)
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY;
    
    if (!privateKeyHex) {
      console.log("❌ 请设置环境变量 APTOS_PRIVATE_KEY");
      console.log("💡 提示：");
      console.log("   export APTOS_PRIVATE_KEY=0x您的64位十六进制私钥");
      console.log("   node test-demonstrate.js");
      console.log("\n🔧 或者使用测试私钥：");
      console.log("   export APTOS_PRIVATE_KEY=0x8b1c55e6d8e6c5431d9ca1b56fdc3be99b5b3a9e1a7b1a9b5e8a5c3b5b8e5a9b5e8a");
      return;
    }

    // 验证私钥格式
    const cleanPrivateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
    
    if (cleanPrivateKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
      console.log("❌ 私钥格式不正确");
      console.log("当前私钥:", privateKeyHex);
      console.log("私钥必须是64位十六进制字符串，格式如：0x1234...abcd");
      console.log("长度应为66个字符（包含0x前缀）");
      return;
    }

    console.log("私钥格式验证通过，长度:", cleanPrivateKey.length);

    const privateKey = new Ed25519PrivateKey(cleanPrivateKey);
    const account = Account.fromPrivateKey({ privateKey });
    console.log("账户地址:", account.accountAddress.toString());

    // 2. 创建第一个 Oath - APY 保证类型
    console.log("\n📝 测试创建 APY 保证类型的 Oath...");
    
    const apyParams = {
      ...TEST_CASES.APY_GUARANTEE,
      endTime: createFutureTimestamp(30), // 30天后到期
      content: `测试 APY 保证 ${new Date().toISOString()}: 30天内最低12%年化收益`
    };

    console.log("APY 参数:", apyParams);

    const apyResult = await createOathWithTokens(account, apyParams);
    console.log("✅ APY Oath 创建成功!");
    console.log("交易哈希:", apyResult.hash);
    console.log("区块链浏览器:", `https://explorer.aptoslabs.com/txn/${apyResult.hash}?network=testnet`);

    // 3. 创建第二个 Oath - TVL 增长类型
    console.log("\n📈 测试创建 TVL 增长类型的 Oath...");
    
    const tvlParams = {
      ...TEST_CASES.TVL_GROWTH,
      endTime: createFutureTimestamp(90), // 90天后到期
      content: `测试 TVL 增长 ${new Date().toISOString()}: 90天内增长50%`
    };

    console.log("TVL 参数:", tvlParams);

    const tvlResult = await createOathWithTokens(account, tvlParams);
    console.log("✅ TVL Oath 创建成功!");
    console.log("交易哈希:", tvlResult.hash);
    console.log("区块链浏览器:", `https://explorer.aptoslabs.com/txn/${tvlResult.hash}?network=testnet`);

    console.log("\n🎉 createOathWithTokens 测试完成!");
    return {
      account: account.accountAddress.toString(),
      apyTxHash: apyResult.hash,
      tvlTxHash: tvlResult.hash
    };

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    if (error.message.includes('invalid_hex_chars')) {
      console.log("\n🔧 私钥格式错误解决方案：");
      console.log("1. 确保私钥是64位十六进制字符串");
      console.log("2. 私钥应以0x开头");
      console.log("3. 例如：export APTOS_PRIVATE_KEY=0x1234567890abcdef...");
    }
    throw error;
  }
}

// 只运行 createOathWithTokens 测试
demonstrateOathCreation();