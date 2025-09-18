#!/bin/bash

# Oath-Vault 绑定功能完整演示脚本
# 新模块名: oath_vault

echo "=== Oath-Vault 绑定功能完整演示 ==="

CONTRACT_ADDRESS="0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0"
MODULE_NAME="oath_vault"

echo "合约地址: ${CONTRACT_ADDRESS}"
echo "模块名: ${MODULE_NAME}"
echo ""

# 注意：由于 Aptos 不允许在同一包中删除已发布的模块，
# 我们使用了新的模块名 oath_vault 来部署更新版本

echo "=== 步骤 1: 初始化合约 ==="
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::init"
echo ""

echo "=== 步骤 2: 创建 Vault (APY: 8%) ==="
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::create_vault \\"
echo "  --args u64:2000000 u64:2000000 u64:8000"
echo ""

echo "=== 步骤 3: 创建绑定 Vault 的 Oath ==="
echo "承诺: 通过 Vault #1 获得 7% 年化收益"
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::create_oath \\"
echo "  --args string:\"DeFi高收益承诺\" \\"
echo "  string:\"我承诺通过指定的Vault获得7%年化收益\" \\"
echo "  string:\"DeFi投资\" \\"
echo "  u64:200000 \\"
echo "  u64:1735689600 \\"
echo "  \"option<u64>\":\"some(1)\" \\"
echo "  \"option<u64>\":\"some(7000)\" \\"
echo "  \"option<address>\":\"some(${CONTRACT_ADDRESS})\""
echo ""

echo "=== 步骤 4: 查询 Oath 绑定信息 ==="
echo "命令: aptos move view --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::get_oath_vault_binding \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1"
echo ""

echo "=== 步骤 5: 检查是否达到目标收益率 ==="
echo "命令: aptos move view --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::check_oath_target_achievement \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1"
echo ""
echo "预期结果: Vault APY=8000 (8%) >= 目标 APY=7000 (7%)，应该返回 true"
echo ""

echo "=== 步骤 6: 自动检查并更新 Oath 状态 ==="
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::check_and_update_oath_status \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1 u64:1735689700"
echo ""
echo "说明: 由于 Vault 收益率(8%) 达到了目标(7%)，Oath 状态会变为 COMPLETED"
echo ""

echo "=== 步骤 7: 查询更新后的 Oath 状态 ==="
echo "命令: aptos move view --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::get_oath \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1"
echo ""

echo "=== 步骤 8: 创建一个失败的案例 ==="
echo "创建 Vault (APY: 5%)"
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::create_vault \\"
echo "  --args u64:1000000 u64:1000000 u64:5000"
echo ""

echo "创建绑定该 Vault 的 Oath (目标 APY: 8%)"
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::create_oath \\"
echo "  --args string:\"高风险投资承诺\" \\"
echo "  string:\"承诺获得8%高收益\" \\"
echo "  string:\"风险投资\" \\"
echo "  u64:300000 \\"
echo "  u64:1735689600 \\"
echo "  \"option<u64>\":\"some(2)\" \\"
echo "  \"option<u64>\":\"some(8000)\" \\"
echo "  \"option<address>\":\"some(${CONTRACT_ADDRESS})\""
echo ""

echo "检查第二个 Oath 状态"
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::check_and_update_oath_status \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:2 u64:1735689700"
echo ""
echo "说明: 由于 Vault 收益率(5%) 未达到目标(8%)，Oath 状态会变为 FAILED"
echo ""

echo "=== 步骤 9: 批量检查所有 Oath 状态 ==="
echo "命令: aptos move run --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::batch_check_oath_status \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1735689700"
echo ""

echo "=== 步骤 10: 查询各种绑定关系 ==="
echo ""
echo "查询绑定 Vault #1 的所有 Oath:"
echo "命令: aptos move view --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::get_oaths_by_vault \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1 address:${CONTRACT_ADDRESS}"
echo ""

echo "查询需要检查的 Oath 列表:"
echo "命令: aptos move view --function-id ${CONTRACT_ADDRESS}::${MODULE_NAME}::get_pending_check_oaths \\"
echo "  --args address:${CONTRACT_ADDRESS} u64:1735689700"
echo ""

echo "=== 核心特性总结 ==="
echo "✅ Oath 可以绑定特定的 Vault"
echo "✅ 设置目标年化收益率 (APY)"
echo "✅ 系统自动检查 Vault 实际收益率"
echo "✅ 根据收益率对比自动决定 Oath 成功/失败"
echo "✅ 支持批量状态检查"
echo "✅ 提供完整的查询接口"
echo ""

echo "=== 自动化建议 ==="
echo "1. 设置定时任务调用 batch_check_oath_status"
echo "2. 监控 Vault 收益率变化"
echo "3. 自动通知用户 Oath 状态更新"
echo "4. 前端集成实时状态显示"

echo ""
echo "注意: 由于结构体变更，需要重新部署到新地址或使用新模块名"
echo "当前模块: ${CONTRACT_ADDRESS}::${MODULE_NAME}"