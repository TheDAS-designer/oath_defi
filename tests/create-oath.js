/**
 * 简单的命令行创建 Oath 工具
 */

const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

// 合约配置
const CONTRACT_CONFIG = {
  address: "0xdf32eca75a3aaf80cd45c6cf410e11606e911f1eb24627538bbb4969f3d09582",
  module: "oath_vault_v7",
  network: Network.TESTNET
};

// 初始化 Aptos 客户端
const config = new AptosConfig({ network: CONTRACT_CONFIG.network });
const aptos = new Aptos(config);

/**
 * 创建测试账户
 */
function createTestAccount() {
  const privateKey = new Ed25519PrivateKey("0x37368b46ce665362562c6d1d4ec01a08c8644c488690df5a17e13ba163e20221");
  return Account.fromPrivateKey({ privateKey });
}

/**
 * 获取当前时间戳（秒）
 */
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 获取结束时间戳（当前时间 + 天数）
 */
function getEndTimestamp(days = 30) {
  return getCurrentTimestamp() + (days * 24 * 60 * 60);
}

/**
 * 创建 Oath
 */
async function createOath(params = {}) {
  try {
    console.log(`🚀 开始创建 Oath...`);
    console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('='.repeat(60));

    const account = createTestAccount();
    console.log(`👤 使用账户: ${account.accountAddress}`);

    // 默认参数
    const defaultParams = {
      content: "完成每日学习目标",
      description: "每天学习编程至少2小时",
      category: "学习成长",
      collateralAmount: 1000000, // 1 APT (6 decimals)
      endTime: getEndTimestamp(30), // 30天后
      vaultAddress: "",
      targetAPY: 950, // 9.5%
      categoryId: "learning_growth_001",
      // 抵押代币信息
      tokenSymbols: ["APT"],
      tokenAmounts: [1000000], // 1 APT
      tokenAddresses: ["0x1::aptos_coin::AptosCoin"],
      tokenUsdValues: [1200000] // $12 (6 decimals)
    };

    // 合并用户参数和默认参数
    const finalParams = { ...defaultParams, ...params };

    console.log(`📋 Oath 参数:`);
    console.log(`   内容: ${finalParams.content}`);
    console.log(`   描述: ${finalParams.description}`);
    console.log(`   分类: ${finalParams.category}`);
    console.log(`   分类ID: ${finalParams.categoryId}`);
    console.log(`   抵押总额: ${finalParams.collateralAmount / 1000000} APT`);
    console.log(`   结束时间: ${new Date(finalParams.endTime * 1000).toLocaleString('zh-CN')}`);
    console.log(`   目标APY: ${finalParams.targetAPY / 100}%`);
    console.log(`   抵押代币: ${finalParams.tokenSymbols.join(', ')}`);
    console.log('='.repeat(60));

    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::create_oath_with_tokens`,
        functionArguments: [
          finalParams.content,
          finalParams.description,
          finalParams.category,
          finalParams.collateralAmount,
          finalParams.endTime,
          finalParams.vaultAddress,
          finalParams.targetAPY,
          finalParams.categoryId,
          finalParams.tokenSymbols,
          finalParams.tokenAmounts,
          finalParams.tokenAddresses,
          finalParams.tokenUsdValues
        ],
      },
    });

    console.log(`📦 构建交易成功`);

    // 签名并提交交易
    const committedTxn = await aptos.signAndSubmitTransaction({ 
      signer: account, 
      transaction 
    });

    console.log(`✅ 交易已提交: ${committedTxn.hash}`);
    console.log(`🔗 查看交易: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`);

    // 等待交易确认
    console.log(`⏳ 等待交易确认...`);
    const executedTxn = await aptos.waitForTransaction({ 
      transactionHash: committedTxn.hash 
    });

    console.log('='.repeat(60));
    console.log(`🎉 Oath 创建成功！`);
    console.log(`📊 交易详情:`);
    console.log(`   交易哈希: ${executedTxn.hash}`);
    console.log(`   Gas 使用: ${executedTxn.gas_used}`);
    console.log(`   状态: ${executedTxn.success ? '成功' : '失败'}`);
    console.log(`   版本: ${executedTxn.version}`);

    // 检查事件
    if (executedTxn.events && executedTxn.events.length > 0) {
      console.log(`\n🎪 触发的事件:`);
      executedTxn.events.forEach((event, index) => {
        if (event.type.includes('OathCreatedEvent')) {
          console.log(`\n   📋 事件 ${index + 1}: OathCreatedEvent`);
          console.log(`      Oath ID: ${event.data.id}`);
          console.log(`      创建者: ${event.data.creator}`);
          console.log(`      内容: ${event.data.content}`);
          console.log(`      分类: ${event.data.category}`);
          console.log(`      抵押金额: ${event.data.stable_collateral / 1000000} APT`);
          console.log(`      抵押代币数: ${event.data.collateral_tokens_count}`);
          console.log(`      目标APY: ${event.data.target_apy?.vec?.[0] / 100 || '未设置'}%`);
          console.log(`      状态: ${event.data.status}`);
        }
      });
    }

    console.log('='.repeat(60));
    return {
      success: true,
      transactionHash: executedTxn.hash,
      events: executedTxn.events
    };

  } catch (error) {
    console.error(`❌ 创建 Oath 失败:`, error);
    if (error.message) {
      console.error(`   错误信息: ${error.message}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 命令行参数解析
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--content':
        params.content = value;
        break;
      case '--description':
        params.description = value;
        break;
      case '--category':
        params.category = value;
        break;
      case '--days':
        params.endTime = getEndTimestamp(parseInt(value));
        break;
      case '--amount':
        params.collateralAmount = parseInt(value) * 1000000; // 转换为最小单位
        break;
      case '--apy':
        params.targetAPY = parseInt(value) * 100; // 转换为基点
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return params;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🚀 Oath 创建工具使用说明

用法: node create-oath.js [选项]

选项:
  --content <内容>        誓言内容 (默认: "完成每日学习目标")
  --description <描述>    详细描述 (默认: "每天学习编程至少2小时")
  --category <分类>       誓言分类 (默认: "学习成长")
  --days <天数>          持续天数 (默认: 30)
  --amount <数量>        抵押APT数量 (默认: 1)
  --apy <收益率>         目标APY百分比 (默认: 9.5)
  --help                 显示此帮助信息

示例:
  node create-oath.js
  node create-oath.js --content "每日运动" --description "每天跑步30分钟" --category "健康" --days 60 --amount 2 --apy 10
  `);
}

/**
 * 主函数
 */
async function main() {
  console.log(`🎯 Oath 创建工具`);
  console.log(`📅 ${new Date().toLocaleString('zh-CN')}`);
  console.log();

  // 解析命令行参数
  const userParams = parseCommandLineArgs();

  // 创建 Oath
  const result = await createOath(userParams);

  if (result.success) {
    console.log(`\n✅ 任务完成！Oath 已成功创建`);
    process.exit(0);
  } else {
    console.log(`\n❌ 任务失败！请检查错误信息`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error(`💥 程序异常:`, error);
    process.exit(1);
  });
}

module.exports = { createOath, parseCommandLineArgs };