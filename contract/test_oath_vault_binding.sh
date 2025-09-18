#!/bin/bash

# Oath-Vault 绑定功能测试脚本

echo "=== Oath-Vault 绑定功能测试 ==="

CONTRACT_ADDRESS="0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0"

echo "注意：由于结构体更改，需要使用新地址重新部署合约"
echo "以下是测试流程示例："

echo ""
echo "1. 初始化合约"
echo "aptos move run --function-id ${CONTRACT_ADDRESS}::oath::init"

echo ""
echo "2. 创建一个 Vault (APY: 6.5%)"
echo "aptos move run --function-id ${CONTRACT_ADDRESS}::oath::create_vault --args u64:1000000 u64:1000000 u64:6500"

echo ""
echo "3. 创建一个绑定 Vault 的 Oath (目标 APY: 6%)"
echo "aptos move run --function-id ${CONTRACT_ADDRESS}::oath::create_oath \\"
echo "  --args string:\"DeFi收益承诺\" \\"
echo "  string:\"承诺通过Vault获得6%年化收益\" \\"
echo "  string:\"DeFi\" \\"
echo "  u64:100000 \\"
echo "  u64:1640995200 \\"
echo "  \"option<u64>\":\"some(1)\" \\"
echo "  \"option<u64>\":\"some(6000)\" \\"
echo "  \"option<address>\":\"some(${CONTRACT_ADDRESS})\""

echo ""
echo "4. 查询 Oath 绑定的 Vault 信息"
echo "aptos move view --function-id ${CONTRACT_ADDRESS}::oath::get_oath_vault_binding --args address:${CONTRACT_ADDRESS} u64:1"

echo ""
echo "5. 检查 Oath 是否达到目标收益率"
echo "aptos move view --function-id ${CONTRACT_ADDRESS}::oath::check_oath_target_achievement --args address:${CONTRACT_ADDRESS} u64:1"

echo ""
echo "6. 检查并更新 Oath 状态（使用当前时间戳）"
echo "aptos move run --function-id ${CONTRACT_ADDRESS}::oath::check_and_update_oath_status --args address:${CONTRACT_ADDRESS} u64:1 u64:1640995300"

echo ""
echo "7. 查询更新后的 Oath 状态"
echo "aptos move view --function-id ${CONTRACT_ADDRESS}::oath::get_oath --args address:${CONTRACT_ADDRESS} u64:1"

echo ""
echo "8. 获取所有绑定特定 Vault 的 Oath 列表"
echo "aptos move view --function-id ${CONTRACT_ADDRESS}::oath::get_oaths_by_vault --args address:${CONTRACT_ADDRESS} u64:1 address:${CONTRACT_ADDRESS}"

echo ""
echo "=== 功能说明 ==="
echo "1. Oath 结构体新增了 vault_id、target_apy、vault_owner 字段"
echo "2. 创建 Oath 时可以绑定一个 Vault 并设置目标 APY"
echo "3. 系统会自动检查 Vault 的实际 APY 是否达到目标"
echo "4. 如果达到目标，Oath 状态变为 COMPLETED"
echo "5. 如果未达到目标，Oath 状态变为 FAILED"
echo "6. 提供了多个查询函数来管理 Oath-Vault 绑定关系"

echo ""
echo "=== 智能合约自动化流程 ==="
echo "• 定期调用 batch_check_oath_status 来批量检查所有到期的 Oath"
echo "• 系统根据 Vault 实际收益率自动决定 Oath 的成功/失败状态"
echo "• 无需人工干预，完全基于 DeFi 收益数据的自动化判断"