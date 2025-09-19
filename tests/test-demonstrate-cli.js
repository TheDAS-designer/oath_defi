/**
 * demonstrateOathCreation 函数的 CLI 命令生成版本
 * 生成可直接执行的 CLI 命令，而不是直接调用 SDK
 */

const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

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
 * 预设的测试用例
 */
const TEST_CASES = {
  APY_GUARANTEE: {
    content: "演示测试 APY 保证: 30天内最低12%年化收益",
    description: "demonstrateOathCreation 函数创建的 APY 保证测试",
    category: "APY Guarantee",
    collateralAmount: 100000,
    vaultAddress: "0xvault1234567890abcdef",
    targetAPY: 1200,
    categoryId: "apy-guarantee-demo",
    collateralTokens: [
      { symbol: "USDC", amount: 80000, address: "0xusdc", usdValue: 80000 },
      { symbol: "APT", amount: 2500, address: "0xapt", usdValue: 20000 }
    ]
  },

  TVL_GROWTH: {
    content: "演示测试 TVL 增长: 90天内增长50%",
    description: "demonstrateOathCreation 函数创建的 TVL 增长测试",
    category: "TVL Growth", 
    collateralAmount: 250000,
    vaultAddress: "0xvault2345678901bcdef",
    targetAPY: 0,
    categoryId: "tvl-growth-demo",
    collateralTokens: [
      { symbol: "USDC", amount: 150000, address: "0xusdc", usdValue: 150000 },
      { symbol: "APT", amount: 12500, address: "0xapt", usdValue: 100000 }
    ]
  }
};

/**
 * 创建未来的时间戳
 */
function createFutureTimestamp(daysFromNow) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);
  return Math.floor(futureDate.getTime() / 1000);
}

/**
 * 生成 CLI 命令
 */
function generateCLICommand(params) {
  const tokenSymbols = params.collateralTokens.map(t => `"${t.symbol}"`).join(',');
  const tokenAmounts = params.collateralTokens.map(t => t.amount).join(',');
  const tokenAddresses = params.collateralTokens.map(t => `"${t.address}"`).join(',');
  const tokenUsdValues = params.collateralTokens.map(t => t.usdValue).join(',');

  return `aptos move run --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::create_oath_with_tokens" --args 'string:${params.content}' 'string:${params.description}' 'string:${params.category}' 'u64:${params.collateralAmount}' 'u64:${params.endTime}' 'string:${params.vaultAddress}' 'u64:${params.targetAPY}' 'string:${params.categoryId}' 'string:[${tokenSymbols}]' 'u64:[${tokenAmounts}]' 'string:[${tokenAddresses}]' 'u64:[${tokenUsdValues}]' --assume-yes`;
}

/**
 * demonstrateOathCreation 函数的演示版本
 */
async function demonstrateOathCreation() {
  console.log("🚀 开始 Oath 合约集成演示 (CLI 命令生成模式)");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);

  try {
    // 使用已知的测试地址
    const testAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
    console.log("测试账户地址:", testAddress);

    // 1. 获取当前 Oath 数量
    const initialCount = await getOathCount(testAddress);
    console.log("当前 Oath 数量:", initialCount);

    // 2. 准备第一个 Oath - APY 保证类型
    console.log("\n📝 准备创建 APY 保证类型的 Oath...");
    
    const apyParams = {
      ...TEST_CASES.APY_GUARANTEE,
      endTime: createFutureTimestamp(30), // 30天后到期
      content: `演示测试 APY 保证 #${initialCount + 1}: 30天内最低12%年化收益`
    };

    console.log("APY 保证参数:");
    console.log(JSON.stringify(apyParams, null, 2));
    
    const apyCLI = generateCLICommand(apyParams);
    console.log("\n💻 APY 保证 CLI 命令:");
    console.log(apyCLI);

    // 3. 准备第二个 Oath - TVL 增长类型
    console.log("\n📈 准备创建 TVL 增长类型的 Oath...");
    
    const tvlParams = {
      ...TEST_CASES.TVL_GROWTH,
      endTime: createFutureTimestamp(90), // 90天后到期
      content: `演示测试 TVL 增长 #${initialCount + 2}: 90天内增长50%`
    };

    console.log("TVL 增长参数:");
    console.log(JSON.stringify(tvlParams, null, 2));
    
    const tvlCLI = generateCLICommand(tvlParams);
    console.log("\n💻 TVL 增长 CLI 命令:");
    console.log(tvlCLI);

    // 4. 生成执行脚本
    console.log("\n📋 完整的执行步骤:");
    console.log("=".repeat(60));
    console.log("1. 切换到合约目录:");
    console.log("   cd /Users/zhaozhiming/work/workspace/aptos-workspace/oath_defi/contract");
    
    console.log("\n2. 执行第一个命令 (APY 保证):");
    console.log(apyCLI);
    
    console.log("\n3. 执行第二个命令 (TVL 增长):");
    console.log(tvlCLI);
    
    console.log("\n4. 验证结果:");
    console.log(`   aptos move view --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count" --args address:${testAddress}`);

    // 5. 生成批量执行脚本
    console.log("\n📝 生成批量执行脚本:");
    console.log("=".repeat(60));
    
    const batchScript = `#!/bin/bash
# demonstrateOathCreation 批量执行脚本
echo "🚀 开始 Oath 创建演示..."

# 切换到合约目录
cd /Users/zhaozhiming/work/workspace/aptos-workspace/oath_defi/contract

# 查询初始状态
echo "📊 查询初始 Oath 数量..."
aptos move view --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count" --args address:${testAddress}

# 创建第一个 Oath - APY 保证
echo "📝 创建 APY 保证 Oath..."
${apyCLI}

# 创建第二个 Oath - TVL 增长
echo "📈 创建 TVL 增长 Oath..."
${tvlCLI}

# 查询最终状态
echo "📊 查询最终 Oath 数量..."
aptos move view --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count" --args address:${testAddress}

# 查询最新创建的 Oath
echo "📋 查询最新创建的 Oath..."
FINAL_COUNT=$(aptos move view --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath_count" --args address:${testAddress} | jq -r '.Result[0]')
aptos move view --function-id "${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_oath" --args address:${testAddress} u64:$FINAL_COUNT

echo "✅ 演示完成!"`;

    console.log(batchScript);

    // 6. TypeScript 调用示例
    console.log("\n📝 TypeScript 调用示例:");
    console.log("=".repeat(60));
    console.log(`
import { createOathWithTokens } from '@/lib/oathUtils';

// APY 保证 Oath
const apyResult = await createOathWithTokens(account, ${JSON.stringify(apyParams, null, 2)});
console.log("APY Oath 创建成功:", apyResult.hash);

// TVL 增长 Oath  
const tvlResult = await createOathWithTokens(account, ${JSON.stringify(tvlParams, null, 2)});
console.log("TVL Oath 创建成功:", tvlResult.hash);
`);

    console.log("\n🎉 demonstrateOathCreation 演示准备完成!");
    console.log("现在你可以:");
    console.log("1. 复制上面的 CLI 命令手动执行");
    console.log("2. 保存批量脚本到文件并执行");
    console.log("3. 在 TypeScript 项目中使用示例代码");
    
    return {
      testAddress,
      initialCount,
      apyParams,
      tvlParams,
      apyCLI,
      tvlCLI
    };

  } catch (error) {
    console.error("❌ 演示准备过程中出现错误:", error);
    throw error;
  }
}

// 运行演示
demonstrateOathCreation();