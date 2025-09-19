# Oath DeFi 测试文件

本目录包含所有 Oath DeFi 项目的测试代码。

## 测试文件说明

### 📁 文件结构
```
tests/
├── README.md                    # 本文件，测试说明
├── test-demonstrate.js          # 主要功能演示测试
├── test-demonstrate-cli.js      # CLI 命令行测试工具
├── test-oath.js                 # Oath 创建功能测试
└── simple-test.js               # 简单测试工具
```

### 📋 测试文件详情

#### 1. test-demonstrate.js
- **功能**: 测试 `createOathWithTokens` 函数的完整功能
- **特点**: 
  - 仅测试创建功能，不包含查询
  - 包含 APY 保证和 TVL 增长两种测试用例
  - 自动私钥验证和错误处理
- **运行**: `node test-demonstrate.js`

#### 2. test-demonstrate-cli.js  
- **功能**: 命令行工具，用于快速测试不同场景
- **特点**:
  - 支持多种预设测试场景
  - 包含详细的执行日志
  - 支持自定义参数
- **运行**: `node test-demonstrate-cli.js`

#### 3. test-oath.js
- **功能**: 专门测试 Oath 创建和管理功能
- **特点**:
  - 包含完整的生命周期测试
  - 测试参数验证
  - 包含错误场景测试
- **运行**: `node test-oath.js`

#### 4. simple-test.js
- **功能**: 简化的测试工具，用于快速验证基本功能
- **特点**:
  - 最小化配置
  - 快速验证合约部署
  - 基础功能检查
- **运行**: `node simple-test.js`

## 🚀 运行测试

### 环境准备
1. 设置私钥环境变量：
```bash
export APTOS_PRIVATE_KEY=your_64_hex_private_key_here
```

2. 进入测试目录：
```bash
cd tests
```

### 运行所有测试
```bash
# 运行主要功能测试
node test-demonstrate.js

# 运行 CLI 测试工具
node test-demonstrate-cli.js

# 运行 Oath 功能测试
node test-oath.js

# 运行简单测试
node simple-test.js
```

### 测试场景

#### 成功场景
- APY 保证 Oath 创建
- TVL 增长 Oath 创建
- 多种抵押代币组合
- 自动初始化验证

#### 错误场景
- 无效私钥格式
- 缺少环境变量
- 网络连接问题
- 合约调用失败

## 📊 测试结果

测试成功后会显示：
- ✅ 交易哈希
- 🔗 区块链浏览器链接
- 📋 详细的参数信息
- ⏱️ 执行时间统计

## 🔧 开发说明

### 添加新测试
1. 在 `tests/` 目录下创建新的测试文件
2. 遵循现有的命名规范：`test-功能名.js`
3. 更新本 README 文件

### 测试最佳实践
- 使用清晰的测试用例名称
- 包含详细的日志输出
- 处理所有可能的错误情况
- 验证交易成功和失败情况

## 📞 联系信息

如有测试相关问题，请查看：
- 合约代码：`../contract/sources/`
- 前端代码：`../frontend/src/`
- 项目文档：`../README.md`