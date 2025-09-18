# Oath-Vault 绑定功能详细说明

## 功能概述

我们成功为 Oath DeFi 合约增加了 Oath 和 Vault 的绑定关系，实现了基于实际 DeFi 收益率的自动化誓言状态管理。

## 核心功能

### 1. 结构体更新

#### Oath 结构体新增字段：
```move
struct Oath has key, store, copy, drop {
    // ... 原有字段
    vault_id: Option<u64>,        // 绑定的 Vault ID  
    target_apy: Option<u64>,      // 目标年化收益率（基点）
    vault_owner: Option<address>, // Vault 拥有者地址
}
```

### 2. 创建功能

#### 绑定 Vault 的 Oath 创建：
```move
public entry fun create_oath(
    creator: &signer,
    title: string::String,
    description: string::String, 
    category: string::String,
    usdt_collateral: u64,
    deadline: u64,
    vault_id: Option<u64>,
    target_apy: Option<u64>,
    vault_owner: Option<address>
)
```

#### 简单 Oath 创建（不绑定 Vault）：
```move
public entry fun create_simple_oath(
    creator: &signer,
    title: string::String,
    description: string::String,
    category: string::String, 
    usdt_collateral: u64,
    deadline: u64
)
```

### 3. 自动状态检查

#### 单个 Oath 状态检查：
```move
public entry fun check_and_update_oath_status(
    oath_owner: address,
    oath_id: u64,
    current_time: u64
)
```

**逻辑流程：**
1. 检查 Oath 是否到期（current_time > deadline）
2. 如果绑定了 Vault，获取 Vault 的实际 APY
3. 比较实际 APY 与目标 APY：
   - 实际 APY >= 目标 APY → 状态变为 `STATUS_COMPLETED`
   - 实际 APY < 目标 APY → 状态变为 `STATUS_FAILED`
4. 如果没有绑定 Vault 或 Vault 不存在 → 状态变为 `STATUS_FAILED`

#### 批量状态检查：
```move
public entry fun batch_check_oath_status(
    oath_owner: address,
    current_time: u64
)
```

### 4. 查询功能

#### 查询 Oath 绑定信息：
```move
#[view]
public fun get_oath_vault_binding(oath_owner: address, oath_id: u64): 
    (Option<u64>, Option<u64>, Option<address>)
```
返回：(vault_id, target_apy, vault_owner)

#### 检查目标达成情况：
```move
#[view] 
public fun check_oath_target_achievement(oath_owner: address, oath_id: u64):
    (bool, u64, u64)
```
返回：(是否达到目标, 当前APY, 目标APY)

#### 查询绑定特定 Vault 的所有 Oath：
```move
#[view]
public fun get_oaths_by_vault(oath_owner: address, vault_id: u64, vault_owner: address):
    vector<Oath>
```

#### 查询待检查的 Oath 列表：
```move
#[view]
public fun get_pending_check_oaths(oath_owner: address, current_time: u64):
    vector<Oath>
```

## 使用场景

### 场景1：DeFi 收益承诺
用户创建一个 Oath，承诺通过特定的 Vault 获得 6% 的年化收益：
- 绑定 vault_id = 1
- 设置 target_apy = 6000（6.00%，以基点表示）
- 系统会在到期时自动检查该 Vault 的实际收益率

### 场景2：投资策略验证
投资顾问创建 Oath，预测某个投资组合能达到 8% 收益：
- 绑定相应的 Vault
- 设置目标收益率
- 到期后系统自动验证预测准确性

### 场景3：DeFi 协议性能承诺
DeFi 协议方承诺其产品能提供稳定收益：
- 绑定协议的收益 Vault
- 承诺最低收益率
- 用户可通过 Oath 状态验证协议性能

## 自动化流程

### 定时任务建议：
1. **每小时检查**：调用 `get_pending_check_oaths` 获取需要检查的 Oath
2. **批量处理**：调用 `batch_check_oath_status` 更新所有到期 Oath 状态
3. **状态通知**：根据更新结果发送通知给相关用户

### 前端集成：
1. **创建界面**：允许用户选择绑定 Vault 和设置目标收益率
2. **监控面板**：显示 Oath 状态和收益率对比
3. **自动刷新**：定期查询 Oath 状态更新

## 优势特点

1. **完全自动化**：无需人工干预，基于链上数据自动判断
2. **透明公正**：所有判断逻辑都在智能合约中，公开透明
3. **实时准确**：直接从 Vault 获取最新收益数据
4. **灵活扩展**：支持绑定不同类型的 Vault 和投资策略
5. **状态可追溯**：所有状态变更都记录在链上

## 部署注意事项

由于修改了 Oath 结构体，需要使用新地址重新部署合约：
1. 编译成功，所有功能已实现
2. 建议在测试网充分测试后再部署到主网
3. 前端需要更新对应的接口调用