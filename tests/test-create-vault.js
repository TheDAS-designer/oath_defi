/**
 * 测试创建 Vault 并查询列表
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
 * 确保 VaultTable 存在，如果不存在则创建
 */
async function initializeVaultTable(account) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::initialize_vault_table`,
      typeArguments: [],
      functionArguments: [],
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
 * 创建测试 Vault
 */
async function createTestVault(account, vaultConfig) {
  console.log("Creating vault with config:", vaultConfig.name);

  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::create_vault`,
      typeArguments: [],
      functionArguments: [
        vaultConfig.target_apy,
        vaultConfig.strategy,
        vaultConfig.initial_deposit,
        vaultConfig.vault_name,
        vaultConfig.vault_symbol,
        vaultConfig.vault_description,
        vaultConfig.curator,
        vaultConfig.timelock_days,
        vaultConfig.guardian_opt,
        vaultConfig.guardian_value,
        vaultConfig.fee_rate,
        vaultConfig.performance_fee,
        vaultConfig.markets,
        vaultConfig.market_addresses,
        vaultConfig.allocation_percentages,
        // VaultStrategy 参数
        vaultConfig.strategy_name,
        vaultConfig.strategy_description,
        vaultConfig.risk_level,
        vaultConfig.supported_tokens,
        vaultConfig.strategy_type,
        vaultConfig.min_duration,
        vaultConfig.max_duration,
        vaultConfig.auto_compound,
        vaultConfig.emergency_exit
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
 * 获取用户的所有 Vault 列表
 */
async function getAllVaults(ownerAddress) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_all_vaults`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });

  return result[0];
}

/**
 * 获取 Vault 数量
 */
async function getVaultCount(ownerAddress) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_vault_count`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });

  return parseInt(result[0]);
}

/**
 * 预设的 Vault 配置
 */
const VAULT_CONFIGS = {
  HIGH_YIELD: {
    target_apy: 1500, // 15% APY
    strategy: "High Yield DeFi Strategy",
    initial_deposit: 100000,
    vault_name: "高收益 DeFi 策略金库",
    vault_symbol: "HYDF",
    vault_description: "专注于高收益 DeFi 协议的投资策略，目标年化收益15%",
    curator: "DeFi Strategy Team",
    timelock_days: 7,
    guardian_opt: true,
    guardian_value: "0x1234567890abcdef",
    fee_rate: 200, // 2%
    performance_fee: 1000, // 10%
    markets: ["Compound", "Aave", "Uniswap"],
    market_addresses: ["0xcompound", "0xaave", "0xuniswap"],
    allocation_percentages: [40, 35, 25],
    // VaultStrategy 参数
    strategy_name: "Multi-Protocol Yield Farming",
    strategy_description: "通过多协议收益农场获得最佳回报",
    risk_level: 3, // 中等风险
    supported_tokens: ["USDC", "USDT", "DAI", "ETH"],
    strategy_type: "Yield Farming",
    min_duration: 86400, // 1天
    max_duration: 7776000, // 90天
    auto_compound: true,
    emergency_exit: true
  },

  STABLE_INCOME: {
    target_apy: 800, // 8% APY
    strategy: "Stable Income Strategy",
    initial_deposit: 50000,
    vault_name: "稳定收益金库",
    vault_symbol: "STBL",
    vault_description: "专注于稳定收益的保守投资策略，目标年化收益8%",
    curator: "Conservative Team",
    timelock_days: 3,
    guardian_opt: false,
    guardian_value: "",
    fee_rate: 100, // 1%
    performance_fee: 500, // 5%
    markets: ["USDC Lending", "Treasury Bills"],
    market_addresses: ["0xusdc_lending", "0xtreasury"],
    allocation_percentages: [70, 30],
    // VaultStrategy 参数
    strategy_name: "Conservative Fixed Income",
    strategy_description: "通过稳定的固定收益产品获得稳定回报",
    risk_level: 1, // 低风险
    supported_tokens: ["USDC", "USDT"],
    strategy_type: "Fixed Income",
    min_duration: 86400, // 1天
    max_duration: 2592000, // 30天
    auto_compound: false,
    emergency_exit: true
  },

  GROWTH_FOCUSED: {
    target_apy: 2500, // 25% APY
    strategy: "Growth Focused Strategy",
    initial_deposit: 200000,
    vault_name: "增长聚焦金库",
    vault_symbol: "GRTH",
    vault_description: "专注于增长型投资的激进策略，目标年化收益25%",
    curator: "Growth Investment Team",
    timelock_days: 14,
    guardian_opt: true,
    guardian_value: "0xgrowth_guardian",
    fee_rate: 300, // 3%
    performance_fee: 1500, // 15%
    markets: ["DEX Trading", "Liquidity Mining", "Governance Tokens"],
    market_addresses: ["0xdex", "0xliquidity", "0xgovernance"],
    allocation_percentages: [50, 30, 20],
    // VaultStrategy 参数
    strategy_name: "Aggressive Growth Trading",
    strategy_description: "通过积极的交易和流动性挖矿获得高回报",
    risk_level: 5, // 高风险
    supported_tokens: ["ETH", "BTC", "APT", "USDC"],
    strategy_type: "Active Trading",
    min_duration: 604800, // 7天
    max_duration: 15552000, // 180天
    auto_compound: true,
    emergency_exit: false
  }
};

/**
 * 主测试函数
 */
async function testCreateAndQueryVaults() {
  console.log("🚀 开始测试创建 Vault 并查询列表");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);

  try {
    // 1. 初始化账户
    const privateKeyHex = process.env.APTOS_PRIVATE_KEY;
    
    if (!privateKeyHex) {
      console.log("❌ 请设置环境变量 APTOS_PRIVATE_KEY");
      console.log("💡 提示：");
      console.log("   export APTOS_PRIVATE_KEY=0x您的64位十六进制私钥");
      console.log("   node test-create-vault.js");
      return;
    }

    // 验证私钥格式
    const cleanPrivateKey = privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
    
    if (cleanPrivateKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
      console.log("❌ 私钥格式不正确");
      console.log("当前私钥:", privateKeyHex);
      console.log("私钥必须是64位十六进制字符串，格式如：0x1234...abcd");
      return;
    }

    const privateKey = new Ed25519PrivateKey(cleanPrivateKey);
    const account = Account.fromPrivateKey({ privateKey });
    console.log("账户地址:", account.accountAddress.toString());

    // 2. 查询初始 Vault 数量
    const initialCount = await getVaultCount(account.accountAddress.toString());
    console.log("初始 Vault 数量:", initialCount);

    // 3. 如果需要，初始化 VaultTable
    if (initialCount === 0) {
      console.log("\n📝 初始化 VaultTable...");
      try {
        await initializeVaultTable(account);
        console.log("✅ VaultTable 初始化成功!");
      } catch (error) {
        if (error.message.includes("ALREADY_INITIALIZED")) {
          console.log("ℹ️ VaultTable 已经初始化过了");
        } else {
          throw error;
        }
      }
    }

    // 4. 创建测试 Vault
    console.log("\n💼 创建测试 Vault...");
    
    const vaultNames = Object.keys(VAULT_CONFIGS);
    for (let i = 0; i < vaultNames.length; i++) {
      const vaultName = vaultNames[i];
      const vaultConfig = VAULT_CONFIGS[vaultName];
      
      console.log(`\n${i + 1}. 创建 ${vaultConfig.vault_name}...`);
      
      try {
        const result = await createTestVault(account, vaultConfig);
        console.log(`✅ ${vaultConfig.vault_name} 创建成功!`);
        console.log(`交易哈希: ${result.hash}`);
        console.log(`区块链浏览器: https://explorer.aptoslabs.com/txn/${result.hash}?network=testnet`);
      } catch (error) {
        console.log(`❌ ${vaultConfig.vault_name} 创建失败:`, error.message);
        if (error.message.includes("ALREADY_INITIALIZED")) {
          console.log("可能是重复创建，继续下一个...");
        }
      }
    }

    // 5. 查询创建后的 Vault 列表
    console.log("\n📊 查询创建后的 Vault 列表...");
    
    const finalCount = await getVaultCount(account.accountAddress.toString());
    console.log(`最终 Vault 数量: ${finalCount}`);
    console.log(`新增 Vault 数量: ${finalCount - initialCount}`);

    if (finalCount > 0) {
      const allVaults = await getAllVaults(account.accountAddress.toString());
      console.log(`\n💼 Vault 列表详情:`);
      
      allVaults.forEach((vault, index) => {
        console.log(`\n=== Vault #${index + 1} ===`);
        console.log(`ID: ${vault.id}`);
        console.log(`名称: ${vault.configuration.name} (${vault.configuration.symbol})`);
        console.log(`描述: ${vault.configuration.description}`);
        console.log(`策略: ${vault.strategy.name}`);
        console.log(`目标 APY: ${vault.state.target_apy / 100}%`);
        console.log(`风险等级: ${vault.strategy.risk_level}/5`);
        console.log(`TVL: $${vault.state.total_value_locked}`);
        console.log(`管理费: ${vault.configuration.fee_rate / 100}%`);
        console.log(`性能费: ${vault.configuration.performance_fee / 100}%`);
        console.log(`支持代币: [${vault.strategy.supported_tokens.join(', ')}]`);
        console.log(`自动复利: ${vault.strategy.auto_compound ? '是' : '否'}`);
      });
    }

    console.log("\n🎉 Vault 创建和查询测试完成!");

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    throw error;
  }
}

// 运行测试
testCreateAndQueryVaults();