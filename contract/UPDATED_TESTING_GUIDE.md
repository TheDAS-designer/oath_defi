# Oath Vault V2 合约测试指南（更新版）

## 新增功能

### 查询誓言列表

**功能**: 获取指定用户的所有誓言列表

**命令**:
```bash
aptos move view \
  --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::get_oath_list \
  --args address:0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0
```

**输入参数**:
| 参数 | 类型 | 描述 | 示例值 |
|------|------|------|--------|
| owner | address | 誓言所有者地址 | 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0 |

**预期输出**: 
```json
{
  "Result": [
    [
      {
        "category": "default",
        "collateral_tokens": [...],
        "compensation_info": {...},
        "content": "测试誓言 - 这是一个测试誓言的描述",
        "creator": "0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0",
        "id": "1",
        "status": 0,
        // ... 其他字段
      },
      // ... 更多誓言
    ]
  ]
}
```

**说明**: 
- 返回指定地址下的所有誓言，无论状态如何
- 按 ID 顺序返回（从 1 开始）
- 包含完整的誓言结构数据
- 如果用户没有誓言，返回空数组

**使用场景**:
- 用户中心显示所有誓言
- 管理界面批量操作
- 数据分析和统计
- 前端应用状态同步

---

## 完整的可用查询函数列表

以下所有函数都可以使用 `aptos move view` 命令调用：

### 1. 誓言相关查询

1. **get_oath(owner: address, oath_id: u64)** - 获取单个誓言详情
2. **get_oath_list(owner: address)** - 🆕 获取用户所有誓言列表
3. **get_oath_vault_binding(oath_owner: address, oath_id: u64)** - 获取誓言与 Vault 绑定关系
4. **get_pending_check_oaths(oath_owner: address, current_time: u64)** - 获取需要检查状态的誓言
5. **get_oaths_by_vault(oath_owner: address, vault_id: u64, vault_owner: address)** - 获取绑定特定 Vault 的誓言
6. **check_oath_target_achievement(oath_owner: address, oath_id: u64)** - 检查誓言是否达到目标收益率

### 2. Vault 相关查询

1. **get_vault(owner: address, vault_id: u64)** - 获取单个 Vault 详情
2. **get_vault_list(owner: address)** - 获取用户所有 Vault 列表
3. **get_vault_allocations(owner: address, vault_id: u64)** - 获取 Vault 分配列表
4. **get_high_yield_vaults(owner: address, min_apy: u64)** - 获取高收益 Vault
5. **calculate_vault_total_yield(owner: address, vault_id: u64)** - 计算 Vault 总收益

### 3. SBT 相关查询

1. **get_sbt(owner: address, sbt_id: u64)** - 获取 SBT 详情

---

## 测试新增功能

### 测试查询誓言列表

1. **确保已有誓言数据**:
   ```bash
   # 如果还没有誓言，先创建一个
   aptos move run \
     --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::create_simple_oath \
     --args string:"第二个测试誓言" string:"这是第二个测试誓言" string:"测试2" u64:2000 u64:1758384000 \
     --profile default
   ```

2. **查询所有誓言**:
   ```bash
   aptos move view \
     --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath_vault_v2::get_oath_list \
     --args address:0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0
   ```

3. **验证返回数据**:
   - 检查是否返回了数组格式
   - 验证誓言数量是否正确
   - 确认每个誓言包含完整字段
   - 验证 ID 排序是否正确

---

## 开发集成建议

### 前端集成

```typescript
// 获取用户所有誓言
async function getUserOaths(userAddress: string): Promise<Oath[]> {
  const result = await aptosClient.view({
    function: `${CONTRACT_ADDRESS}::oath_vault_v2::get_oath_list`,
    arguments: [userAddress],
    type_arguments: []
  });
  
  return result[0] as Oath[];
}

// 获取单个誓言详情
async function getOathDetail(userAddress: string, oathId: number): Promise<Oath | null> {
  const result = await aptosClient.view({
    function: `${CONTRACT_ADDRESS}::oath_vault_v2::get_oath`,
    arguments: [userAddress, oathId.toString()],
    type_arguments: []
  });
  
  const oathOption = result[0] as { vec: Oath[] };
  return oathOption.vec.length > 0 ? oathOption.vec[0] : null;
}
```

### 性能考虑

1. **分页处理**: 对于拥有大量誓言的用户，考虑在合约层面添加分页功能
2. **缓存策略**: 前端可以缓存誓言列表，仅在有新交易时重新获取
3. **增量更新**: 可以只查询特定状态的誓言，减少数据传输

---

## 更新的测试检查清单

- [ ] 合约成功初始化
- [ ] 创建简单誓言成功
- [ ] 创建 Vault 成功  
- [ ] 添加 Vault 分配成功
- [ ] 查询单个誓言数据正确
- [ ] 🆕 查询誓言列表功能正常
- [ ] 查询 Vault 数据正确
- [ ] 错误处理正确（如访问不存在的 ID）
- [ ] 🆕 空列表查询返回正确

---

## 版本更新记录

### v2.1 (当前版本)
- ✅ 新增 `get_oath_list` 函数
- ✅ 支持获取用户所有誓言列表
- ✅ 优化查询性能和数据结构

### v2.0
- ✅ 基础合约功能
- ✅ 誓言和 Vault 创建
- ✅ 资产分配和状态管理

这份更新文档涵盖了新增的查询功能，可以与之前的测试指南配合使用。