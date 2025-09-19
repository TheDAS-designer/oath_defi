module OathDefi::types_v7 {
	use std::string;
	use std::option::Option;

	// 状态常量
	const STATUS_ACTIVE: u8 = 1;
	const STATUS_COMPLETED: u8 = 2;
	const STATUS_EXPIRED: u8 = 3;
	const STATUS_FAILED: u8 = 4;

	/// Oath 誓言结构体
	/// 表示用户创建的去中心化誓言，包含承诺内容、抵押信息和执行状态
	struct Oath has store, copy, drop {
		// 基本信息
		id: u64,                                    // 誓言唯一标识符
		creator: address,                           // 创建者地址
		content: string::String,                    // 誓言内容描述
		category: string::String,                   // 誓言分类（如：DeFi、治理等）
		categoryId: string::String,                   // 誓言分类id（如：DeFi、治理等）
		
		// 时间信息
		start_time: u64,                            // 誓言开始时间戳
		end_time: u64,                              // 誓言结束时间戳
		
		// 抵押相关
		stable_collateral: u64,                     // 稳定币抵押数量
		collateral_tokens: vector<CollateralToken>, // 其他抵押代币列表
		is_over_collateralized: bool,               // 是否过度抵押
		
		// Vault 集成
		vault_address: Option<address>,             // 关联的 Vault 地址（可选）
		target_apy: Option<u64>,                    // 目标年化收益率（基点）
		current_apy: Option<u64>,                   // 当前年化收益率（基点）
		
		// 状态和证据
		status: u8,                                 // 誓言状态（活跃/完成/过期/失败）
		evidence: string::String,                   // 完成证据
		referenced_nfts: vector<string::String>,    // 引用的NFT列表
		
		// 风险管理
		slashing_info: Option<SlashingInfo>,        // 削减信息（如果被惩罚）
		compensation_info: Option<CompensationInfo>, // 补偿信息（如果需要赔偿）
	}

	/// SBT (Soul Bound Token) 灵魂绑定代币结构体
	/// 用于记录用户完成誓言后铸造的不可转让凭证
	struct SBT has store, copy, drop {
		id: u64,           // SBT 唯一标识符
		owner: address,    // 持有者地址（不可转让）
		oath_id: u64,      // 对应的誓言ID
		mint_time: u64,    // 铸造时间戳
	}

	/// 抵押代币结构体
	/// 记录用户在誓言中抵押的各种代币信息
	struct CollateralToken has store, copy, drop {
		symbol: string::String,   // 代币符号 (如: USDC, APT)
		amount: u64,             // 抵押数量
		address: string::String, // 代币合约地址
		usd_value: u64,          // USD 价值
		locked_time: u64,        // 锁定时间戳
	}

	/// 削减信息结构体
	/// 当用户违约时记录惩罚信息
	struct SlashingInfo has store, copy, drop {
		slashed_amount: u64,   // 被削减的金额
		slashing_time: u64,    // 削减发生时间
		reason: string::String, // 削减原因
	}

	/// 补偿信息结构体
	/// 当系统需要补偿用户时记录相关信息
	struct CompensationInfo has store, copy, drop {
		compensation_amount: u64, // 补偿金额
		compensation_time: u64,   // 补偿时间
		compensated_to: address,  // 补偿接收者地址
	}

	/// Vault 投资策略结构体
	/// 定义 Vault 的投资策略和风险参数
	struct VaultStrategy has store, copy, drop {
		name: string::String,                    // 策略名称
		description: string::String,             // 策略描述
		risk_level: u8,                         // 风险等级 (0-低风险, 1-中风险, 2-高风险)
		supported_tokens: vector<string::String>, // 支持的代币列表
		strategy_type: string::String,           // 策略类型 (defi, arbitrage, yield_farming 等)
		min_duration: u64,                      // 最小投资期限（天数）
		max_duration: u64,                      // 最大投资期限（天数）
		auto_compound: bool,                    // 是否自动复投
		emergency_exit: bool,                   // 是否支持紧急退出
	}

	/// 市场分配结构体
	/// 记录 Vault 在各个 DeFi 市场的资金分配比例
	struct MarketAllocation has store, copy, drop {
		market_address: string::String,  // 市场合约地址
		allocation_percentage: u64,      // 分配百分比，基点表示 (10000 = 100%)
	}

	/// DeFi 市场信息结构体
	/// 记录各个 DeFi 协议市场的详细信息
	struct Market has store, copy, drop {
		address: string::String,         // 市场合约地址
		name: string::String,           // 市场名称
		collateral_token: string::String, // 抵押代币地址
		borrow_token: string::String,    // 借贷代币地址
		lltv: u64,                      // 贷款价值比，基点表示 (10000 = 100%)
		utilization_rate: u64,          // 资金利用率，基点表示 (10000 = 100%)
		supply_apy: u64,                // 供应年化收益率，基点表示 (10000 = 100%)
		borrow_apy: u64,                // 借贷年化利率，基点表示 (10000 = 100%)
		total_supply: u64,              // 总供应量
		total_borrow: u64,              // 总借贷量
		is_active: bool,                // 市场是否活跃
	}

	/// Vault 配置结构
	struct VaultConfiguration has store, copy, drop {
		name: string::String,
		symbol: string::String,
		description: string::String,
		strategy: string::String,
		curator: string::String,
		timelock: u64, // 时间锁定期（天数）
		guardian: Option<string::String>,
		fee_rate: u64, // 费率百分比，基点表示 (100 = 1%)
		performance_fee: u64, // 表现费百分比，基点表示 (100 = 1%)
		markets: vector<string::String>, // 市场地址列表
		allocations: vector<MarketAllocation>, // 分配比例
	}

	/// Vault 状态结构
	struct VaultState has store, copy, drop {
		apy: u64,                      // 年化收益率 (基点表示, 6630 = 6.63%)
		total_assets: u64,             // 总资产数量
		total_assets_usd: u64,         // 总资产USD价值
		total_supply: u64,             // 总份额
		share_price: u64,              // 份额价格（精度为6位小数）
		performance_fee_collected: u64, // 已收取的表现费
	}

	/// 资金分配结构
	struct Allocation has store, copy, drop {
		market_address: address,       // 市场地址
		supply_assets: u64,            // 投入资产
		supply_assets_usd: u64,        // 投入资产USD价值
		expected_apy: u64,             // 预期年化收益率
	}

	/// Vault 活动记录结构
	struct VaultActivity has store, copy, drop {
		activity_type: string::String, // 活动类型 ("deposit", "withdraw", "rebalance", "harvest")
		amount: u64,                   // 金额
		timestamp: u64,                // 时间戳
		user: address,                 // 用户地址
		transaction_hash: string::String, // 交易哈希
	}

	/// Vault 结构
	struct Vault has store, copy, drop {
		id: u64,
		creator: address,
		strategy: VaultStrategy,
		configuration: VaultConfiguration,
		state: VaultState,
		activities: vector<VaultActivity>,
		allocations: vector<Allocation>,
	}

	/// 详细 Vault 信息
	struct DetailedVault has store, copy, drop {
		vault: Vault,
		current_allocations: vector<Allocation>,
		recent_activities: vector<VaultActivity>,
	}

	/// Oath 表
	struct OathTable has key {
		oaths: vector<Oath>,
		next_id: u64,
	}

	/// SBT 表
	struct SBTTable has key {
		sbts: vector<SBT>,
		next_id: u64,
	}

	/// Vault 表
	struct VaultTable has key {
		vaults: vector<Vault>,
		next_id: u64,
	}

	// ========== 状态常量访问器 ==========
	
	public fun get_status_active(): u8 { STATUS_ACTIVE }
	public fun get_status_completed(): u8 { STATUS_COMPLETED }
	public fun get_status_expired(): u8 { STATUS_EXPIRED }
	public fun get_status_failed(): u8 { STATUS_FAILED }

	// ========== 创建函数 ==========

	public fun create_oath(
		id: u64,
		creator: address,
		content: string::String,
		category: string::String,
		categoryId: string::String,
		stable_collateral: u64,
		start_time: u64,
		end_time: u64,
		status: u8,
		referenced_nfts: vector<string::String>,
		evidence: string::String,
		is_over_collateralized: bool,
		target_apy: Option<u64>,
		current_apy: Option<u64>,
		vault_address: Option<address>,
		collateral_tokens: vector<CollateralToken>,
		slashing_info: Option<SlashingInfo>,
		compensation_info: Option<CompensationInfo>,
	): Oath {
		Oath {
			id,
			creator,
			content,
			category,
			categoryId,
			stable_collateral,
			start_time,
			end_time,
			status,
			referenced_nfts,
			evidence,
			is_over_collateralized,
			target_apy,
			current_apy,
			vault_address,
			collateral_tokens,
			slashing_info,
			compensation_info,
		}
	}

	public fun create_sbt(
		id: u64,
		owner: address,
		oath_id: u64,
		mint_time: u64,
	): SBT {
		SBT {
			id,
			owner,
			oath_id,
			mint_time,
		}
	}

	public fun create_collateral_token(
		symbol: string::String,
		amount: u64,
		address: string::String,
		usd_value: u64,
		locked_time: u64,
	): CollateralToken {
		CollateralToken {
			symbol,
			amount,
			address,
			usd_value,
			locked_time,
		}
	}

	public fun create_vault_strategy(
		name: string::String,
		description: string::String,
		risk_level: u8,
		supported_tokens: vector<string::String>,
		strategy_type: string::String,
		min_duration: u64,
		max_duration: u64,
		auto_compound: bool,
		emergency_exit: bool,
	): VaultStrategy {
		VaultStrategy {
			name,
			description,
			risk_level,
			supported_tokens,
			strategy_type,
			min_duration,
			max_duration,
			auto_compound,
			emergency_exit,
		}
	}

	public fun create_market_allocation(
		market_address: string::String,
		allocation_percentage: u64,
	): MarketAllocation {
		MarketAllocation {
			market_address,
			allocation_percentage,
		}
	}

	public fun create_market(
		address: string::String,
		name: string::String,
		collateral_token: string::String,
		borrow_token: string::String,
		lltv: u64,
		utilization_rate: u64,
		supply_apy: u64,
		borrow_apy: u64,
		total_supply: u64,
		total_borrow: u64,
		is_active: bool,
	): Market {
		Market {
			address,
			name,
			collateral_token,
			borrow_token,
			lltv,
			utilization_rate,
			supply_apy,
			borrow_apy,
			total_supply,
			total_borrow,
			is_active,
		}
	}

	public fun create_vault_configuration(
		name: string::String,
		symbol: string::String,
		description: string::String,
		strategy: string::String,
		curator: string::String,
		timelock: u64,
		guardian: Option<string::String>,
		fee_rate: u64,
		performance_fee: u64,
		markets: vector<string::String>,
		allocations: vector<MarketAllocation>,
	): VaultConfiguration {
		VaultConfiguration {
			name,
			symbol,
			description,
			strategy,
			curator,
			timelock,
			guardian,
			fee_rate,
			performance_fee,
			markets,
			allocations,
		}
	}

	public fun create_vault_state(
		apy: u64,
		total_assets: u64,
		total_assets_usd: u64,
		total_supply: u64,
		share_price: u64,
		performance_fee_collected: u64,
	): VaultState {
		VaultState {
			apy,
			total_assets,
			total_assets_usd,
			total_supply,
			share_price,
			performance_fee_collected,
		}
	}

	public fun create_vault(
		id: u64,
		creator: address,
		strategy: VaultStrategy,
		configuration: VaultConfiguration,
		state: VaultState,
		activities: vector<VaultActivity>,
		allocations: vector<Allocation>,
	): Vault {
		Vault {
			id,
			creator,
			strategy,
			configuration,
			state,
			activities,
			allocations,
		}
	}

	// ========== 访问器函数 (Getters) ==========

	public fun oath_get_id(oath: &Oath): u64 { oath.id }
	public fun oath_get_creator(oath: &Oath): address { oath.creator }
	public fun oath_get_content(oath: &Oath): string::String { oath.content }
	public fun oath_get_status(oath: &Oath): u8 { oath.status }

	public fun sbt_get_id(sbt: &SBT): u64 { sbt.id }
	public fun sbt_get_owner(sbt: &SBT): address { sbt.owner }
	public fun sbt_get_oath_id(sbt: &SBT): u64 { sbt.oath_id }

	public fun vault_get_id(vault: &Vault): u64 { vault.id }
	public fun vault_get_creator(vault: &Vault): address { vault.creator }

	// ========== 修改器函数 (Setters) ==========

	public fun oath_set_status(oath: &mut Oath, status: u8) {
		oath.status = status;
	}

	public fun oath_set_evidence(oath: &mut Oath, evidence: string::String) {
		oath.evidence = evidence;
	}
}