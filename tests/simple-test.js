/**
 * 简化的命令行测试 - 使用已知的账户
 */

const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

// 合约配置
const CONTRACT_ADDRESS = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
const MODULE_NAME = "oath_vault_v7";

// 初始化 Aptos 客户端
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

/**
 * 查询函数
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
 * 生成等效的 CLI 命令
 */
function generateCLICommand(params) {
  const tokenSymbols = params.collateralTokens.map(t => `"${t.symbol}"`).join(',');
  const tokenAmounts = params.collateralTokens.map(t => t.amount).join(',');
  const tokenAddresses = params.collateralTokens.map(t => `"${t.address}"`).join(',');
  const tokenUsdValues = params.collateralTokens.map(t => t.usdValue).join(',');

  return `aptos move run --function-id "${CONTRACT_ADDRESS}::${MODULE_NAME}::create_oath_with_tokens" --args 'string:${params.content}' 'string:${params.description}' 'string:${params.category}' 'u64:${params.collateralAmount}' 'u64:${params.endTime}' 'string:${params.vaultAddress}' 'u64:${params.targetAPY}' 'string:${params.categoryId}' 'string:[${tokenSymbols}]' 'u64:[${tokenAmounts}]' 'string:[${tokenAddresses}]' 'u64:[${tokenUsdValues}]' --assume-yes`;
}

/**
 * 主测试函数
 */
async function testOathContract() {
  try {
    console.log("🧪 Oath 合约 Node.js 调用测试");
    console.log("=".repeat(50));
    console.log("合约地址:", CONTRACT_ADDRESS);
    console.log("模块名称:", MODULE_NAME);
    console.log("网络: Testnet");
    
    // 使用已知的测试地址
    const testAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
    
    // 1. 查询当前状态
    console.log("\n📊 当前状态查询:");
    console.log("-".repeat(30));
    const currentCount = await getOathCount(testAddress);
    console.log(`当前 Oath 总数: ${currentCount}`);
    
    // 2. 查询最新的几个 Oath
    if (currentCount > 0) {
      console.log("\n📋 最新 Oath 详情:");
      console.log("-".repeat(30));
      
      const latestOath = await getOath(testAddress, currentCount);
      const oathData = latestOath[0].vec[0];
      
      console.log(`最新 Oath (#${currentCount}) 信息:`);
      console.log(`- ID: ${oathData.id}`);
      console.log(`- 内容: ${oathData.content}`);
      console.log(`- 分类: ${oathData.category} (${oathData.categoryId})`);
      console.log(`- 抵押总额: ${oathData.stable_collateral} USD`);
      console.log(`- 状态: ${oathData.status} (1=Active)`);
      console.log(`- 创建时间: ${new Date(parseInt(oathData.start_time) * 1000).toLocaleString()}`);
      console.log(`- 结束时间: ${new Date(parseInt(oathData.end_time) * 1000).toLocaleString()}`);
      
      if (oathData.target_apy.vec.length > 0) {
        console.log(`- 目标 APY: ${parseInt(oathData.target_apy.vec[0]) / 100}%`);
      }
      
      if (oathData.collateral_tokens.length > 0) {
        console.log("- 抵押代币:");
        oathData.collateral_tokens.forEach((token, index) => {
          console.log(`  ${index + 1}. ${token.symbol}: ${token.amount} (${token.address}) = $${token.usd_value}`);
        });
      }
    }
    
    // 3. 生成新的测试用例参数
    console.log("\n🛠️  新测试用例生成:");
    console.log("-".repeat(30));
    
    const newTestCase = {
      content: `Node.js CLI 测试 #${currentCount + 1}: 高收益策略承诺`,
      description: "通过 Node.js 脚本创建的自动化测试誓言",
      category: "High Yield Strategy",
      collateralAmount: 75000,
      endTime: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // 60天后
      vaultAddress: "0xvault567890123def",
      targetAPY: 2000, // 20%
      categoryId: "high-yield-nodejs-test",
      collateralTokens: [
        { symbol: "USDC", amount: 60000, address: "0xusdc", usdValue: 60000 },
        { symbol: "APT", amount: 1875, address: "0xapt", usdValue: 15000 }
      ]
    };
    
    console.log("测试参数:");
    console.log(JSON.stringify(newTestCase, null, 2));
    
    // 4. 生成对应的 CLI 命令
    console.log("\n💻 等效的 CLI 命令:");
    console.log("-".repeat(30));
    console.log(generateCLICommand(newTestCase));
    
    // 5. 显示调用方法
    console.log("\n🚀 手动执行方法:");
    console.log("-".repeat(30));
    console.log("1. 复制上面的 CLI 命令");
    console.log("2. 在合约目录中执行:");
    console.log("   cd /Users/zhaozhiming/work/workspace/aptos-workspace/oath_defi/contract");
    console.log("3. 粘贴并执行 CLI 命令");
    
    // 6. TypeScript 代码示例
    console.log("\n📝 TypeScript 调用示例:");
    console.log("-".repeat(30));
    console.log(`
import { createOathWithTokens } from '@/lib/oathUtils';

const result = await createOathWithTokens(account, ${JSON.stringify(newTestCase, null, 2)});
console.log("创建成功:", result.hash);
`);
    
    console.log("\n✅ 测试完成!");
    console.log("=".repeat(50));
    
  } catch (error) {
    console.error("❌ 测试失败:", error);
    if (error.message.includes("network")) {
      console.log("💡 提示: 请检查网络连接和 Aptos 节点状态");
    }
  }
}

// 运行测试
testOathContract();