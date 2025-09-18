# 编译合约
aptos move compile

# 部署合约
aptos move publish --assume-yes

# 初始化合约
aptos move run --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath::init --assume-yes

# 创建 Oath
aptos move run --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath::create_oath --args 'string:测试承诺' 'string:这是一个测试承诺，用于验证合约功能' 'string:技术学习' 'u64:100' 'u64:1672531200' --assume-yes

# 查询 Oath
aptos move view --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath::get_oath --args 'address:0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0' 'u64:1'

# 完成 Oath 并铸造 SBT
aptos move run --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath::complete_oath_and_mint_sbt --args 'u64:1' 'u64:1672531300' --assume-yes

# 查询 SBT
aptos move view --function-id 0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0::oath::get_sbt --args 'address:0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0' 'u64:1'


# 测试
