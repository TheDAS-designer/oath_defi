# Oath DeFi 前端数据结构说明文档

## 概述

本文档详细说明了 Oath DeFi 平台前端使用的所有数据结构，包括誓言（Oath）、金库（Vault）、模板（Template）等核心数据类型。

---

## 核心数据结构

### 1. Oath（誓言）

誓言是平台的核心概念，代表用户对特定承诺的抵押和执行。

```typescript
interface Oath {
  id: string;                           // 誓言唯一标识符
  creator: string;                      // 创建者钱包地址
  content: string;                      // 誓言内容描述
  category: string;                     // 誓言类别
  stableCollateral: number;             // 稳定币抵押数量（USDC）
  startTime: number;                    // 开始时间（时间戳）
  endTime: number;                      // 结束时间（时间戳）
  status: OathStatus;                   // 誓言状态
  referencedNFTs: string[];             // 关联的NFT列表
  evidence: string;                     // 执行证据
  isOverCollateralized: boolean;        // 是否超额抵押
  targetAPY?: number;                   // 目标年化收益率（可选）
  currentAPY?: number;                  // 当前年化收益率（可选）
  vaultAddress?: string;                // 关联金库地址（可选）
  collateralTokens: CollateralToken[];  // 抵押代币列表
  slashingInfo?: SlashingInfo;          // 惩罚信息（可选）
  compensationInfo?: CompensationInfo;  // 补偿信息（可选）
}
```

**字段说明：**
- `id`: 系统自动生成的唯一标识符
- `creator`: 创建誓言的用户钱包地址，格式为 0x... 的十六进制字符串
- `content`: 誓言的具体内容，如"APY保证：30天内最低12%年化收益"
- `category`: 誓言分类，如"APY保证"、"TVL增长"、"风险管理"等
- `stableCollateral`: 以USDC计价的抵押金额
- `startTime/endTime`: Unix时间戳（毫秒），表示誓言的有效期
- `status`: 见下文状态枚举说明
- `referencedNFTs`: 相关的SBT（灵魂绑定代币）ID列表
- `evidence`: 完成誓言的证据描述
- `isOverCollateralized`: 是否提供了超过最低要求的抵押
- `targetAPY/currentAPY`: 百分比形式的年化收益率（如12表示12%）
- `vaultAddress`: 绑定的DeFi金库合约地址

### 2. OathStatus（誓言状态）

```typescript
enum OathStatus {
  Active = 'Active',           // 活跃中
  Completed = 'Completed',     // 已完成
  Failed = 'Failed',           // 已失败
  Disputed = 'Disputed'        // 争议中
}
```

**状态说明：**
- `Active`: 誓言正在执行期内，尚未到期
- `Completed`: 誓言已成功完成，创建者获得奖励
- `Failed`: 誓言执行失败，抵押品被惩罚分配
- `Disputed`: 对誓言结果存在争议，需要仲裁

### 3. CollateralToken（抵押代币）

```typescript
interface CollateralToken {
  symbol: string;      // 代币符号（如 USDC、APT）
  amount: number;      // 抵押数量
  address: string;     // 代币合约地址
  usdValue: number;    // 美元计价价值
}
```

**示例数据：**
```typescript
{
  symbol: 'USDC',
  amount: 80000,
  address: '0xusdc',
  usdValue: 80000
}
```

### 4. SlashingInfo（惩罚信息）

当誓言失败时，记录惩罚执行的详细信息。

```typescript
interface SlashingInfo {
  slashedAmount: number;        // 被惩罚的金额
  slashingReason: string;       // 惩罚原因
  slashingTime: number;         // 惩罚执行时间
  arbitratorAddress: string;    // 仲裁者地址
  arbitratorFee: number;        // 仲裁费用
  protocolFee: number;          // 协议费用
}
```

### 5. CompensationInfo（补偿信息）

记录失败誓言的补偿分配情况。

```typescript
interface CompensationInfo {
  totalCompensationPool: number;     // 总补偿资金池
  eligibleUsers: CompensationUser[]; // 有资格获得补偿的用户
  distributedAmount: number;         // 已分配金额
  pendingAmount: number;             // 待分配金额
}

interface CompensationUser {
  address: string;          // 用户地址
  eligibleAmount: number;   // 有资格获得的补偿金额
  claimed: boolean;         // 是否已领取
  claimTime?: number;       // 领取时间（可选）
}
```

---

## DeFi 金库相关

### 6. MetaMorphoVault（金库）

代表一个DeFi投资策略金库。

```typescript
interface MetaMorphoVault {
  address: string;                    // 金库合约地址
  name: string;                       // 金库名称
  symbol: string;                     // 金库符号
  creator: string;                    // 创建者地址
  totalAssets: number;                // 总资产数量
  totalShares: number;                // 总份额数量
  currentAPY: number;                 // 当前年化收益率
  performanceHistory: PerformanceData[]; // 历史表现数据
  hasOath: boolean;                   // 是否绑定誓言
  oathId?: string;                    // 绑定的誓言ID（可选）
}
```

### 7. PerformanceData（表现数据）

记录金库的历史表现。

```typescript
interface PerformanceData {
  timestamp: number;    // 时间戳
  apy: number;         // 年化收益率
  tvl: number;         // 总锁定价值
}
```

**示例数据：**
```typescript
{
  timestamp: 1726531200000,  // 2024年9月17日
  apy: 13.5,                 // 13.5% APY
  tvl: 2500000              // 250万美元TVL
}
```

---

## 模板系统

### 8. OathTemplate（誓言模板）

预定义的誓言类型模板，用于快速创建标准化誓言。

```typescript
interface OathTemplate {
  id: string;                        // 模板唯一标识
  name: string;                      // 模板名称
  description: string;               // 模板描述
  category: string;                  // 模板类别
  minimumCollateral: number;         // 最低抵押要求
  parameters: TemplateParameter[];   // 模板参数列表
}
```

### 9. TemplateParameter（模板参数）

定义模板的可配置参数。

```typescript
interface TemplateParameter {
  key: string;              // 参数键名
  label: string;            // 显示标签
  type: 'number' | 'string' | 'date';  // 参数类型
  required: boolean;        // 是否必填
  placeholder?: string;     // 占位符文本（可选）
  min?: number;            // 最小值（数字类型）
  max?: number;            // 最大值（数字类型）
}
```

**预定义模板类型：**

1. **APY保证模板** (`apy-guarantee`)
   - 承诺在指定期间内达到最低年化收益率
   - 参数：目标APY、持续时间、金库地址

2. **TVL增长承诺** (`tvl-growth`)
   - 承诺在指定期间内增长TVL达到特定百分比
   - 参数：增长目标、持续时间、金库地址

3. **风险管理** (`risk-management`)
   - 保证最大回撤限制并维持最低收益
   - 参数：最大回撤、最低APY、持续时间

4. **代币锁定承诺** (`token-lock`)
   - 锁定团队代币以建立信任
   - 参数：锁定期、代币地址、锁定数量

---

## 协议统计

### 10. protocolStats（协议统计）

记录整个协议的关键指标。

```typescript
interface ProtocolStats {
  totalValueVowed: number;     // 总誓言价值
  activeOaths: number;         // 活跃誓言数量
  completedOaths: number;      // 已完成誓言数量
  failedOaths: number;         // 失败誓言数量
  totalCompensationPaid: number; // 总补偿支付金额
}
```

---

## 数据关系图

```
Protocol Stats
├── Total Value Vowed
├── Active/Completed/Failed Oaths Count
└── Total Compensation Paid

Oath
├── Basic Info (id, creator, content, etc.)
├── Collateral Tokens []
├── Associated Vault (optional)
├── Slashing Info (if failed)
└── Compensation Info (if failed)

Vault
├── Basic Info (address, name, etc.)
├── Performance History []
└── Associated Oath (optional)

Template
├── Basic Info (id, name, category)
├── Minimum Collateral Requirement
└── Parameters []
```

---

## 使用示例

### 创建APY保证誓言

```typescript
const newOath: Partial<Oath> = {
  content: "APY Guarantee: Minimum 12% annual yield for 30 days",
  category: "APY Guarantee",
  stableCollateral: 100000,
  endTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
  targetAPY: 12,
  vaultAddress: "0xvault1234567890abcdef",
  collateralTokens: [
    {
      symbol: "USDC",
      amount: 80000,
      address: "0xusdc",
      usdValue: 80000
    }
  ]
};
```

### 查询活跃誓言

```typescript
const activeOaths = mockOaths.filter(oath => oath.status === OathStatus.Active);
```

### 计算总抵押价值

```typescript
const totalCollateral = mockOaths.reduce((total, oath) => 
  total + oath.collateralTokens.reduce((sum, token) => sum + token.usdValue, 0), 0
);
```

---

## 注意事项

1. **时间戳格式**：所有时间字段使用 Unix 时间戳（毫秒）
2. **地址格式**：所有区块链地址使用 0x 前缀的十六进制字符串
3. **金额精度**：金额字段通常保留到小数点后2位或更高精度
4. **可选字段**：带 `?` 的字段在某些情况下可能为 undefined
5. **枚举值**：状态等枚举值建议使用预定义常量，避免硬编码字符串

此文档涵盖了前端模拟数据中的所有数据结构，为前端开发和API对接提供了完整的参考。