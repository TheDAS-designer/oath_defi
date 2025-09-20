# Oath Vault V2 合约测试指南

## 合约信息
- **合约地址**: `0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0`
- **模块名称**: `oath_vault_v2`
- **网络**: Aptos Testnet
- **部署交易**: `0x9481b7c945562220ee7186fca3dbaca8979550b783ff73b6ef12dc076e8e9987`

## 前置条件

1. 安装并配置 Aptos CLI
2. 配置测试账户 profile（建议使用 `default` profile）
3. 确保账户有足够的测试币用于支付 Gas 费用

## 测试步骤

### 1. 合约初始化

**功能**: 初始化合约的数据表结构（OathTable、SBTTable、VaultTable）

**命令**:
```bash
aptos move run \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::init \
  --profile default
```

**输入参数**: 
- 无（仅需签名者权限）

**预期输出**:
```json
{
  "Result": {
    "transaction_hash": "0xf3833b25306b7ad7636b0e0c5862066282d05e6bcf0b8250209b26cbea7322c9",
    "gas_used": 1361,
    "gas_unit_price": 100,
    "success": true,
    "vm_status": "Executed successfully"
  }
}
```

**说明**: 
- 只能由合约部署者调用一次
- Gas 使用量约 1,361 Octas
- 成功后会在账户下创建三个资源表

---

### 2. 创建简单誓言

**功能**: 创建一个基础的誓言，包含标题、描述、类别、抵押品等信息

**命令**:
```bash
aptos move run \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::create_simple_oath \
  --args string:"测试誓言" string:"这是一个测试誓言的描述" string:"测试" u64:1000 u64:1758297600 \
  --profile default
```

**输入参数**:
| 参数 | 类型 | 描述 | 示例值 |
|------|------|------|--------|
| title | string | 誓言标题 | "测试誓言" |
| description | string | 誓言描述 | "这是一个测试誓言的描述" |
| category | string | 誓言类别 | "测试" |
| usdt_collateral | u64 | USDT抵押品数量 | 1000 |
| deadline | u64 | 截止时间戳 | 1758297600 |

**预期输出**:
```json
{
  "Result": {
    "transaction_hash": "0x97f39529b60c7b4ece45e8271a14485bbe58e0f86fb150e924f69424f632e287",
    "gas_used": 537,
    "gas_unit_price": 100,
    "sender": "a3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
    "sequence_number": 61,
    "replay_protector": {
      "SequenceNumber": 61
    },
    "success": true,
    "timestamp_us": 1758237171547074,
    "version": 6870260156,
    "vm_status": "Executed successfully"
  }
}
```

**说明**:
- 自动生成誓言 ID（从 1 开始递增）
- 默认抵押品类型为 USDT
- Gas 使用量约 537 Octas

---

### 3. 创建 Vault

**功能**: 创建一个详细的 Vault，包含资产、策略、配置等信息

**命令**:
```bash
aptos move run \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::create_vault \
  --args u64:100000 u64:120000 u64:800 \
  --profile default
```

**输入参数**:
| 参数 | 类型 | 描述 | 示例值 |
|------|------|------|--------|
| total_assets | u64 | 总资产数量 | 100000 |
| total_assets_usd | u64 | 总资产USD价值 | 120000 |
| apy | u64 | 年化收益率（基点，如800=8%） | 800 |

**预期输出**:
```json
{
  "Result": {
    "transaction_hash": "0x90228544696a2d3c56471c76df5b9b6bd295e701ffc27067c2cb824fc409b55d",
    "gas_used": 535,
    "gas_unit_price": 100,
    "success": true,
    "vm_status": "Executed successfully"
  }
}
```

**说明**:
- 自动生成 Vault ID（从 1 开始递增）
- 默认配置包含策略、时间锁、费率等
- Gas 使用量约 535 Octas

---

### 4. 添加 Vault 分配

**功能**: 向指定 Vault 添加资产分配，支持多种市场和资金池

**命令**:
```bash
aptos move run \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::add_allocation_to_vault \
  --args u64:1 "hex:0x01" u64:50000 u64:60000 u64:750 "hex:0x02" string:"USDT" string:"USDC" string:"https://example.com/usdt.png" string:"https://example.com/usdc.png" \
  --profile default
```

**输入参数**:
| 参数 | 类型 | 描述 | 示例值 |
|------|------|------|--------|
| vault_id | u64 | 目标Vault ID | 1 |
| market_key | vector<u8> | 市场标识符 | "hex:0x01" |
| supply_assets | u64 | 投入资产数量 | 50000 |
| supply_assets_usd | u64 | 投入资产USD价值 | 60000 |
| apy | u64 | 该分配的年化收益率 | 750 (7.5%) |
| pool_id | vector<u8> | 资金池ID | "hex:0x02" |
| pool_token1 | string | 池中代币1符号 | "USDT" |
| pool_token2 | string | 池中代币2符号 | "USDC" |
| pool_token1_logo | string | 代币1图标URL | "https://example.com/usdt.png" |
| pool_token2_logo | string | 代币2图标URL | "https://example.com/usdc.png" |

**预期输出**:
```json
{
  "Result": {
    "transaction_hash": "0x69fa88162bd61806f4258ac86f5c29c7c2283719fb82762f835ef1a841b6a678",
    "gas_used": 59,
    "gas_unit_price": 100,
    "success": true,
    "vm_status": "Executed successfully"
  }
}
```

**说明**:
- 只有 Vault 的 curator 可以添加分配
- 支持多种资产池类型
- Gas 使用量约 59 Octas

---

## 查询功能

### 1. 查询誓言详情

**功能**: 获取指定誓言的完整信息

**命令**:
```bash
aptos move view \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::get_oath \
  --args address:0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0 u64:1
```

**输入参数**:
| 参数 | 类型 | 描述 | 示例值 |
|------|------|------|--------|
| owner | address | 誓言所有者地址 | 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0 |
| oath_id | u64 | 誓言ID | 1 |

**预期输出**:
```json
{
  "Result": [
    {
      "vec": [
        {
          "category": "default",
          "collateral_tokens": [
            {
              "amount": "1000",
              "symbol": "USDT",
              "token_address": "0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
              "usd_value": "1000"
            }
          ],
          "compensation_info": {
            "vec": [
              {
                "distributed_amount": "0",
                "eligible_users": [],
                "pending_amount": "0",
                "total_compensation_pool": "0"
              }
            ]
          },
          "content": "测试誓言 - 这是一个测试誓言的描述",
          "creator": "0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
          "current_apy": { "vec": [] },
          "end_time": "1758297600",
          "evidence": "",
          "id": "1",
          "is_over_collateralized": false,
          "referenced_nfts": [],
          "slashing_info": {
            "vec": [
              {
                "arbitrator_address": "0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
                "arbitrator_fee": "0",
                "protocol_fee": "0",
                "slashed_amount": "1000",
                "slashing_reason": "Default slashing",
                "slashing_time": "0"
              }
            ]
          },
          "stable_collateral": "1000",
          "start_time": "0",
          "status": 0,
          "target_apy": { "vec": [] },
          "vault_address": { "vec": [] }
        }
      ]
    }
  ]
}
```

### 2. 查询账户资源

**功能**: 查看账户下的所有合约资源

**命令**:
```bash
aptos account list \
  --query resources \
  --account 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0
```

**说明**: 可以看到各种 Table 资源和其 next_id 值

---

## 其他可用的查询函数

以下函数可以使用 `aptos move view` 命令调用：

1. **get_vault(owner: address, vault_id: u64)** - 获取 Vault 详情
2. **get_vault_list(owner: address)** - 获取用户所有 Vault
3. **get_vault_allocations(owner: address, vault_id: u64)** - 获取 Vault 分配列表
4. **get_high_yield_vaults(owner: address, min_apy: u64)** - 获取高收益 Vault
5. **get_oath_vault_binding(oath_owner: address, oath_id: u64)** - 获取誓言与 Vault 绑定关系
6. **get_sbt(owner: address, sbt_id: u64)** - 获取 SBT 详情

---

## 状态代码说明

### 誓言状态 (status)
- `0`: STATUS_ACTIVE - 活跃状态
- `1`: STATUS_COMPLETED - 已完成
- `2`: STATUS_FAILED - 已失败

### 错误代码
- `100`: 仅合约部署者可初始化
- `101`: 表未初始化
- `105`: Vault 不存在
- `106`: 只有 curator 可以操作
- `107`: Oath 不存在
- `108`: 只有活跃状态的 Oath 可以检查

---

## Gas 费用估算

| 操作 | 估算 Gas (Octas) | 备注 |
|------|------------------|------|
| init | ~1,361 | 一次性初始化 |
| create_simple_oath | ~537 | 创建基础誓言 |
| create_vault | ~535 | 创建 Vault |
| add_allocation_to_vault | ~59 | 添加分配 |
| 查询操作 | 0 | 视图函数免费 |

---

## 测试检查清单

- [ ] 合约成功初始化
- [ ] 创建简单誓言成功
- [ ] 创建 Vault 成功  
- [ ] 添加 Vault 分配成功
- [ ] 查询誓言数据正确
- [ ] 查询 Vault 数据正确
- [ ] 错误处理正确（如访问不存在的 ID）

---

## 注意事项

1. **ID 分配**: Vault 和 Oath 的 ID 都从 1 开始，不是从 0
2. **权限控制**: 某些操作需要特定权限（如 curator 权限）
3. **数据格式**: 时间戳使用 Unix 时间戳，APY 使用基点（如 800 = 8%）
4. **错误处理**: 函数调用失败时会返回对应的错误代码
5. **Gas 优化**: 所有操作的 Gas 使用都很低，合约优化良好

此文档涵盖了 `oath_vault_v2` 合约的核心功能测试，可作为开发和测试的参考指南。