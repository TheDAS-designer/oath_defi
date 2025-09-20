# Geomi API 集成说明

这个文档说明如何使用 [Geomi No-Code Indexing](https://geomi.dev/docs/no-code-indexing) 来获取 Oath 事件数据。

## 使用方法

### 1. 获取 Geomi API Key

1. 访问 [Geomi](https://geomi.dev) 并注册账户
2. 在 Geomi 平台配置你的 Oath 事件索引
3. 获取你的 API Key

### 2. 在代码中使用 Geomi API

```typescript
import { useOathData } from '@/hooks/useOathData';

// 使用 Geomi API 获取事件数据
const { oaths, isLoading, error, hasRealData } = useOathData({
  useGeomiEvents: true,
  geomiApiKey: 'your_geomi_api_key_here'
});

// 或者继续使用 getAllOaths 方式（需要连接钱包）
const { oaths, isLoading, error, hasRealData } = useOathData();
```

### 3. 配置 Geomi 索引器

在 Geomi 平台配置索引器时，需要设置以下字段映射：

#### 事件结构
```move
#[event]
struct OathCreatedEvent has drop, store {
    id: u64,
    creator: address,
    content: String,
    category: String,
    category_id: String,
    stable_collateral: u64,
    start_time: u64,
    end_time: u64,
    status: u8,
    evidence: String,
    is_over_collateralized: bool,
    has_vault_address: bool,
    target_apy: Option<u64>,
    collateral_tokens_count: u64,
}
```

#### GraphQL Schema 配置
在 Geomi 中配置表名为 `oath_events`，包含以下字段：
- `id`: Primary Key
- `creator`: Address
- `content`: String
- `category`: String
- `category_id`: String
- `stable_collateral`: Number
- `start_time`: Number
- `end_time`: Number
- `status`: Number
- `evidence`: String
- `is_over_collateralized`: Boolean
- `has_vault_address`: Boolean
- `target_apy`: Number (optional)
- `collateral_tokens_count`: Number
- `transaction_hash`: String
- `created_at`: Timestamp

## API 端点

Geomi GraphQL API: `https://api.geomi.dev/v1/graphql`

## 优势

使用 Geomi API 相比直接查询 Aptos 事件的优势：

1. **性能优化**: Geomi 提供了专门的索引和查询优化
2. **CORS 友好**: 避免了浏览器跨域问题
3. **结构化数据**: 提供了结构化的 GraphQL API
4. **实时更新**: 自动索引最新的区块链事件
5. **无基础设施**: 无需自己运行索引器基础设施

## 注意事项

1. 确保在 Geomi 平台正确配置了事件索引
2. GraphQL 查询需要根据你的实际配置进行调整
3. API Key 需要妥善保管，不要在客户端代码中暴露
4. 生产环境建议通过后端代理 API 调用 