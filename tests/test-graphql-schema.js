/**
 * 获取 Aptos GraphQL Schema 信息
 */

const { Network } = require("@aptos-labs/ts-sdk");

// GraphQL 端点
const GRAPHQL_ENDPOINTS = {
  [Network.TESTNET]: "https://api.testnet.aptoslabs.com/v1/graphql",
  [Network.MAINNET]: "https://api.mainnet.aptoslabs.com/v1/graphql",
  [Network.DEVNET]: "https://api.devnet.aptoslabs.com/v1/graphql"
};

/**
 * 获取 GraphQL Schema
 */
async function getGraphQLSchema(network = Network.TESTNET) {
  const endpoint = GRAPHQL_ENDPOINTS[network];
  
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          name
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
            type {
              name
              kind
            }
          }
        }
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
        query: introspectionQuery
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('获取 Schema 失败:', error);
    throw error;
  }
}

/**
 * 查找可用的查询字段
 */
async function findAvailableQueries(searchTerm = '') {
  console.log("🔍 查找可用的 GraphQL 查询字段...");
  
  try {
    const schema = await getGraphQLSchema();
    const queryFields = schema.data.__schema.queryType.fields;
    
    const matchingFields = queryFields.filter(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`\n找到 ${matchingFields.length} 个匹配的查询字段:`);
    console.log("=".repeat(60));
    
    matchingFields.forEach(field => {
      console.log(`\n📝 ${field.name}`);
      if (field.description) {
        console.log(`   描述: ${field.description}`);
      }
      console.log(`   返回类型: ${field.type.name || field.type.kind}`);
      
      if (field.args && field.args.length > 0) {
        console.log(`   参数:`);
        field.args.forEach(arg => {
          console.log(`     - ${arg.name}: ${arg.type.name || arg.type.kind}`);
        });
      }
    });
    
    return matchingFields;
  } catch (error) {
    console.error('查找查询字段失败:', error);
    throw error;
  }
}

/**
 * 测试简单的 GraphQL 查询
 */
async function testBasicQueries() {
  console.log("🧪 测试基础 GraphQL 查询...");
  
  const endpoint = GRAPHQL_ENDPOINTS[Network.TESTNET];
  
  // 尝试一些基础查询
  const basicQueries = [
    {
      name: "账户信息查询",
      query: `
        query {
          account_resources(
            where: {address: {_eq: "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c"}}
            limit: 5
          ) {
            address
            type
            data
          }
        }
      `
    },
    {
      name: "交易查询",
      query: `
        query {
          user_transactions(
            where: {sender: {_eq: "0x747628e365e0104ccd765058e85ed768e5c8be0085cddd5a6638a97cdc1cdb5c"}}
            limit: 3
            order_by: {version: desc}
          ) {
            version
            sender
            success
            gas_used
            timestamp
          }
        }
      `
    },
    {
      name: "事件查询",
      query: `
        query {
          events(
            limit: 5
            order_by: {transaction_version: desc}
          ) {
            account_address
            type
            data
            transaction_version
          }
        }
      `
    }
  ];

  for (const testQuery of basicQueries) {
    console.log(`\n🔍 执行: ${testQuery.name}`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery.query
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        console.log(`❌ 错误: ${JSON.stringify(result.errors, null, 2)}`);
      } else {
        console.log(`✅ 成功获取数据`);
        console.log(`📊 数据概览:`, Object.keys(result.data));
        
        // 显示第一个结果的概览
        const firstKey = Object.keys(result.data)[0];
        const firstResult = result.data[firstKey];
        if (Array.isArray(firstResult) && firstResult.length > 0) {
          console.log(`📝 示例数据:`, firstResult[0]);
        }
      }
    } catch (error) {
      console.log(`❌ 查询失败: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  console.log("🚀 开始探索 Aptos GraphQL API");
  console.log("=".repeat(50));

  try {
    // 1. 查找账户相关的查询
    await findAvailableQueries('account');
    
    console.log("\n" + "=".repeat(50));
    
    // 2. 测试基础查询
    await testBasicQueries();
    
  } catch (error) {
    console.error("探索 GraphQL API 失败:", error);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getGraphQLSchema,
  findAvailableQueries,
  testBasicQueries
};