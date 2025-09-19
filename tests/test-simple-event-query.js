/**
 * 简化的事件查询脚本（避免速率限制）
 */

const { Network } = require("@aptos-labs/ts-sdk");

async function queryOathEventsSimple() {
  const endpoint = "https://api.testnet.aptoslabs.com/v1/graphql";
  const contractAddress = "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0";
  
  // 查询最近的事件
  const query = `
    query {
      events(
        where: {
          type: {_like: "%oath_vault_v7%"}
        }
        limit: 3
        order_by: {transaction_version: desc}
      ) {
        account_address
        type
        data
        transaction_version
      }
    }
  `;

  try {
    console.log("🔍 查询最近的 Oath 相关事件...");
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL 查询错误:', result.errors);
      return;
    }

    const events = result.data.events || [];
    console.log(`✅ 找到 ${events.length} 个相关事件`);
    
    events.forEach((event, index) => {
      console.log(`\n📋 事件 #${index + 1}:`);
      console.log(`  类型: ${event.type}`);
      console.log(`  交易版本: ${event.transaction_version}`);
      console.log(`  账户: ${event.account_address}`);
      
      if (event.type.includes('OathCreatedEvent')) {
        console.log(`  🎉 这是 OathCreated 事件!`);
        console.log(`  数据预览:`, {
          id: event.data.id,
          creator: event.data.creator,
          content: event.data.content.substring(0, 50) + '...',
          category: event.data.category,
          stable_collateral: event.data.stable_collateral,
          target_apy: event.data.target_apy
        });
      }
    });

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

// 等待 1 分钟后查询（避免速率限制）
setTimeout(() => {
  queryOathEventsSimple();
}, 60000);

console.log("⏳ 等待 1 分钟后查询事件（避免 API 速率限制）...");
console.log("💡 或者可以直接在浏览器中查看交易：");
console.log("🔗 https://explorer.aptoslabs.com/txn/0x0678231a26e02a98e2b546ba25d194ef41b9aa9f79fd30d9191908968fd3245b?network=testnet");