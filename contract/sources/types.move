module OathDefi::types {
	use std::string;
	use std::option::Option;

	// 状态常量
	const STATUS_ACTIVE: u8 = 1;
	const STATUS_COMPLETED: u8 = 2;
	const STATUS_EXPIRED: u8 = 3;
	const STATUS_FAILED: u8 = 4;

	/// Oath 结构
	struct Oath has store, copy, drop {
		id: u64,
		creator: address,
		content: string::String,
		category: string::String,
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
	}

	/// SBT (Soul Bound Token) 结构
	struct SBT has store, copy, drop {
		id: u64,
		owner: address,
		oath_id: u64,
		mint_time: u64,
	}

	/// 抵押代币结构
	struct CollateralToken has store, copy, drop {
		token_address: address,
		amount: u64,
		locked_time: u64,
	}

	/// 削减信息结构
	struct SlashingInfo has store, copy, drop {
		slashed_amount: u64,
		slashing_time: u64,
		reason: string::String,
	}

	/// 补偿信息结构
	struct CompensationInfo has store, copy, drop {
		compensation_amount: u64,
		compensation_time: u64,
		compensated_to: address,
	}

	/// Vault 策略结构
	struct VaultStrategy has store, copy, drop {
		name: string::String,
		description: string::String,
		risk_level: u8,
		supported_tokens: vector<string::String>,
		strategy_type: string::String,
		min_duration: u64,
		max_duration: u64,
		auto_compound: bool,
		emergency_exit: bool,
	}

	/// Vault 配置结构
	struct VaultConfiguration has store, copy, drop {
		name: string::String,
		description: string::String,
		min_deposit: u64,
		max_deposit: u64,
		lock_period: u64,
		target_apy: u64,
		performance_fee_rate: u64,
		management_fee_rate: u64,
		curator: address,
		is_active: bool,
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

	public fun create_vault_configuration(
		name: string::String,
		description: string::String,
		min_deposit: u64,
		max_deposit: u64,
		lock_period: u64,
		target_apy: u64,
		performance_fee_rate: u64,
		management_fee_rate: u64,
		curator: address,
		is_active: bool,
	): VaultConfiguration {
		VaultConfiguration {
			name,
			description,
			min_deposit,
			max_deposit,
			lock_period,
			target_apy,
			performance_fee_rate,
			management_fee_rate,
			curator,
			is_active,
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