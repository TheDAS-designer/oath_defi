/**
 * 测试 Vault 列表查询功能
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
 * 获取用户的 Vault 数量
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
 * 获取用户的 Vault 列表（分页）
 */
async function getVaultList(ownerAddress, startId, limit) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_vault_list`,
      typeArguments: [],
      functionArguments: [ownerAddress, startId, limit],
    },
  });

  return result[0];
}

/**
 * 获取用户的所有 Oath 列表
 */
async function getAllOaths(ownerAddress) {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_CONFIG.address}::${CONTRACT_CONFIG.module}::get_all_oaths`,
      typeArguments: [],
      functionArguments: [ownerAddress],
    },
  });

  return result[0];
}

/**
 * 获取用户的 Oath 数量
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
 * 格式化显示 Vault 信息
 */
function formatVaultInfo(vault, index) {
  console.log(`\n=== Vault #${index + 1} ===`);
  console.log(`ID: ${vault.id}`);
  console.log(`创建者: ${vault.creator}`);
  console.log(`配置信息:`);
  console.log(`  - 名称: ${vault.configuration.name}`);
  console.log(`  - 符号: ${vault.configuration.symbol}`);
  console.log(`  - 描述: ${vault.configuration.description}`);
  console.log(`  - 策略: ${vault.configuration.strategy}`);
  console.log(`  - 管理员: ${vault.configuration.curator}`);
  console.log(`  - 时间锁定天数: ${vault.configuration.timelock_days}`);
  console.log(`  - 费率: ${vault.configuration.fee_rate / 10000}%`);
  console.log(`  - 性能费: ${vault.configuration.performance_fee / 10000}%`);
  
  console.log(`状态信息:`);
  console.log(`  - 目标 APY: ${vault.state.target_apy / 100}%`);
  console.log(`  - 总价值锁定: $${vault.state.total_value_locked}`);
  console.log(`  - 可用流动性: $${vault.state.available_liquidity}`);
  console.log(`  - 总供应量: ${vault.state.total_shares}`);
  console.log(`  - 份额价格: $${vault.state.share_price / 1000000}`);
  
  console.log(`策略信息:`);
  console.log(`  - 策略名称: ${vault.strategy.name}`);
  console.log(`  - 策略类型: ${vault.strategy.strategy_type}`);
  console.log(`  - 风险等级: ${vault.strategy.risk_level}`);
  console.log(`  - 自动复利: ${vault.strategy.auto_compound ? '是' : '否'}`);
  console.log(`  - 紧急退出: ${vault.strategy.emergency_exit ? '是' : '否'}`);
  console.log(`  - 支持代币: [${vault.strategy.supported_tokens.join(', ')}]`);
}

/**
 * 格式化显示 Oath 信息
 */
function formatOathInfo(oath, index) {
  console.log(`\n=== Oath #${index + 1} ===`);
  console.log(`ID: ${oath.id}`);
  console.log(`创建者: ${oath.creator}`);
  console.log(`内容: ${oath.content}`);
  console.log(`分类: ${oath.category} (${oath.category_id})`);
  console.log(`描述: ${oath.description}`);
  console.log(`抵押总额: $${oath.stable_collateral}`);
  console.log(`状态: ${oath.status} (1=Active, 2=Completed, 3=Failed)`);
  console.log(`创建时间: ${new Date(parseInt(oath.start_time) * 1000).toLocaleString()}`);
  console.log(`结束时间: ${new Date(parseInt(oath.end_time) * 1000).toLocaleString()}`);
  
  if (oath.target_apy.vec.length > 0) {
    console.log(`目标 APY: ${parseInt(oath.target_apy.vec[0]) / 100}%`);
  }
  
  if (oath.collateral_tokens.length > 0) {
    console.log(`抵押代币:`);
    oath.collateral_tokens.forEach((token, idx) => {
      console.log(`  ${idx + 1}. ${token.symbol}: ${token.amount} (${token.address}) = $${token.usd_value}`);
    });
  }
}

/**
 * 主测试函数
 */
async function testVaultListQueries() {
  console.log("🚀 开始测试 Vault 列表查询功能");
  console.log("合约地址:", CONTRACT_CONFIG.address);
  console.log("模块名称:", CONTRACT_CONFIG.module);
  console.log("网络:", CONTRACT_CONFIG.network);

  try {
    // 测试地址（可以是任何已部署合约的地址）
    const testAddress = CONTRACT_CONFIG.address;
    
    console.log(`\n📊 查询地址 ${testAddress} 的数据...\n`);

    // 1. 查询 Vault 数量
    console.log("1️⃣ 查询 Vault 数量...");
    const vaultCount = await getVaultCount(testAddress);
    console.log(`✅ Vault 数量: ${vaultCount}`);

    // 2. 查询 Oath 数量
    console.log("\n2️⃣ 查询 Oath 数量...");
    const oathCount = await getOathCount(testAddress);
    console.log(`✅ Oath 数量: ${oathCount}`);

    // 3. 如果有 Vault，查询所有 Vault
    if (vaultCount > 0) {
      console.log("\n3️⃣ 查询所有 Vault...");
      const allVaults = await getAllVaults(testAddress);
      console.log(`✅ 获取到 ${allVaults.length} 个 Vault:`);
      
      allVaults.forEach((vault, index) => {
        formatVaultInfo(vault, index);
      });

      // 4. 测试分页查询 Vault
      if (vaultCount > 1) {
        console.log("\n4️⃣ 测试分页查询 Vault（前2个）...");
        const pagedVaults = await getVaultList(testAddress, 1, 2);
        console.log(`✅ 分页获取到 ${pagedVaults.length} 个 Vault:`);
        
        pagedVaults.forEach((vault, index) => {
          console.log(`\n--- 分页结果 Vault #${index + 1} ---`);
          console.log(`ID: ${vault.id}, 名称: ${vault.configuration.name}`);
        });
      }
    } else {
      console.log("ℹ️ 该地址下没有 Vault 数据");
    }

    // 5. 如果有 Oath，查询所有 Oath
    if (oathCount > 0) {
      console.log("\n5️⃣ 查询所有 Oath...");
      const allOaths = await getAllOaths(testAddress);
      console.log(`✅ 获取到 ${allOaths.length} 个 Oath:`);
      
      allOaths.forEach((oath, index) => {
        formatOathInfo(oath, index);
      });
    } else {
      console.log("ℹ️ 该地址下没有 Oath 数据");
    }

    console.log("\n🎉 Vault 列表查询测试完成!");

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    console.error("错误详情:", error);
    throw error;
  }
}

/**
 * 简化版查询模式
 */
async function simpleQuery() {
  console.log("🔍 简化查询模式");
  console.log("=".repeat(50));
  
  try {
    const testAddress = CONTRACT_CONFIG.address;
    
    const [vaultCount, oathCount] = await Promise.all([
      getVaultCount(testAddress),
      getOathCount(testAddress)
    ]);

    console.log(`地址: ${testAddress}`);
    console.log(`Vault 数量: ${vaultCount}`);
    console.log(`Oath 数量: ${oathCount}`);

    if (vaultCount > 0 || oathCount > 0) {
      console.log("\n📋 数据摘要:");
      
      if (vaultCount > 0) {
        const vaults = await getAllVaults(testAddress);
        console.log(`\n💼 Vault 列表:`);
        vaults.forEach((vault, index) => {
          console.log(`  ${index + 1}. ${vault.configuration.name} (ID: ${vault.id})`);
          console.log(`     策略: ${vault.strategy.name}`);
          console.log(`     TVL: $${vault.state.total_value_locked}`);
          console.log(`     目标APY: ${vault.state.target_apy / 100}%`);
        });
      }

      if (oathCount > 0) {
        const oaths = await getAllOaths(testAddress);
        console.log(`\n📝 Oath 列表:`);
        oaths.forEach((oath, index) => {
          console.log(`  ${index + 1}. ${oath.content.substring(0, 50)}...`);
          console.log(`     分类: ${oath.category}`);
          console.log(`     抵押: $${oath.stable_collateral}`);
          console.log(`     状态: ${oath.status === 1 ? 'Active' : oath.status === 2 ? 'Completed' : 'Failed'}`);
        });
      }
    }

    console.log("\n✅ 简化查询完成!");
  } catch (error) {
    console.error("❌ 简化查询失败:", error.message);
  }
}

// 根据命令行参数决定运行模式
const args = process.argv.slice(2);
if (args.includes('--simple')) {
  simpleQuery();
} else {
  testVaultListQueries();
}