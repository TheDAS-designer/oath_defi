module OathDefi::oath_vault_v2 {
	use std::signer;
	use std::string;
	use std::option::{Self, Option};
	use std::table;
	use std::vector;

	// 错误码常量
	const ERROR_NOT_INITIALIZED: u64 = 101;
	const ERROR_ALREADY_COMPLETED: u64 = 102;
	const ERROR_NOT_CREATOR: u64 = 103;
	const ERROR_INVALID_STATUS: u64 = 104;

	/// Oath 状态
	const STATUS_ACTIVE: u8 = 0;     // 活跃中
	const STATUS_COMPLETED: u8 = 1;  // 已完成
	const STATUS_FAILED: u8 = 2;     // 已失败
	const STATUS_DISPUTED: u8 = 3;   // 争议中

	/// 风险等级
	const RISK_LOW: u8 = 0;     // 低风险
	const RISK_MEDIUM: u8 = 1;  // 中风险
	const RISK_HIGH: u8 = 2;    // 高风险

	/// 抵押代币结构
	struct CollateralToken has store, copy, drop {
		symbol: string::String,  // 代币符号
		amount: u64,            // 数量
		token_address: address, // 代币地址
		usd_value: u64,        // USD价值（精度为6位小数）
	}

	/// 补偿信息结构
	struct CompensationInfo has store, copy, drop {
		total_compensation_pool: u64,  // 总补偿池
		distributed_amount: u64,       // 已分配金额
		pending_amount: u64,          // 待分配金额
		eligible_users: vector<CompensationUser>, // 符合条件的用户
	}

	/// 补偿用户结构
	struct CompensationUser has store, copy, drop {
		user_address: address,     // 用户地址
		eligible_amount: u64,      // 符合条件的金额
		claimed: bool,            // 是否已领取
		claim_time: Option<u64>,  // 领取时间
	}

	/// 惩罚信息结构
	struct SlashingInfo has store, copy, drop {
		slashed_amount: u64,        // 惩罚金额
		slashing_reason: string::String, // 惩罚原因
		slashing_time: u64,         // 惩罚时间
		arbitrator_address: address, // 仲裁者地址
		arbitrator_fee: u64,        // 仲裁费
		protocol_fee: u64,          // 协议费
	}

	/// 增强的 Oath 结构体
	struct Oath has key, store, copy, drop {
		id: u64,
		creator: address,                    // 创建者地址
		content: string::String,             // 内容描述
		category: string::String,            // 类别
		stable_collateral: u64,              // 稳定币抵押
		start_time: u64,                     // 开始时间
		end_time: u64,                       // 结束时间
		status: u8,                          // 状态
		referenced_nfts: vector<string::String>, // 引用的NFT
		evidence: string::String,            // 证据
		is_over_collateralized: bool,        // 是否超额抵押
		target_apy: Option<u64>,             // 目标APY（基点）
		current_apy: Option<u64>,            // 当前APY（基点）
		vault_address: Option<address>,      // Vault地址
		collateral_tokens: vector<CollateralToken>, // 抵押代币列表
		slashing_info: Option<SlashingInfo>, // 惩罚信息
		compensation_info: Option<CompensationInfo>, // 补偿信息
	}

	/// SBT 结构体（不可转让）
	struct SBT has key, store, copy, drop {
		id: u64,
		owner: address,
		oath_id: u64,
		minted_at: u64,
	}

	/// 市场结构
	struct Market has store, copy, drop {
		address: address,               // 市场地址
		name: string::String,           // 市场名称
		collateral_token: string::String, // 抵押代币
		borrow_token: string::String,   // 借贷代币
		lltv: u64,                     // 贷款价值比（基点）
		utilization_rate: u64,         // 利用率（基点）
		supply_apy: u64,               // 供应APY（基点）
		borrow_apy: u64,               // 借贷APY（基点）
		total_supply: u64,             // 总供应量
		total_borrow: u64,             // 总借贷量
		is_active: bool,               // 是否活跃
	}

	/// Vault策略结构
	struct VaultStrategy has store, copy, drop {
		id: string::String,            // 策略ID
		name: string::String,          // 策略名称
		description: string::String,   // 策略描述
		category: string::String,      // 策略类别
		expected_apy: u64,             // 预期APY（基点）
		risk_level: u8,                // 风险等级
		minimum_deposit: u64,          // 最小存款
		lock_period: Option<u64>,      // 锁定期（天）
		features: vector<string::String>, // 特性列表
	}

	/// Vault配置结构
	struct VaultConfiguration has store, copy, drop {
		name: string::String,          // Vault名称
		symbol: string::String,        // Vault符号
		description: string::String,   // 描述
		strategy_id: string::String,   // 策略ID
		curator: address,              // 管理员
		timelock: u64,                 // 时间锁（天）
		guardian: Option<address>,     // 守护者
		fee_rate: u64,                 // 费率（基点）
		performance_fee: u64,          // 表现费（基点）
		markets: vector<address>,      // 市场地址列表
	}

	/// Vault活动记录结构
	struct VaultActivity has store, copy, drop {
		activity_type: string::String, // 活动类型
		timestamp: u64,               // 时间戳
		amount: u64,                  // 金额
		user: address,                // 用户地址
		transaction_hash: string::String, // 交易哈希
	}

	/// Oath 存储表
	struct OathTable has key {
		table: table::Table<u64, Oath>,
		next_id: u64,
	}

	/// SBT 存储表
	struct SBTTable has key {
		table: table::Table<u64, SBT>,
		next_id: u64,
	}

	/// Vault 存储表
	struct VaultTable has key {
		table: table::Table<u64, DetailedVault>,
		next_id: u64,
	}

	/// 市场存储表
	struct MarketTable has key {
		table: table::Table<address, Market>,
	}

	/// 策略存储表
	struct StrategyTable has key {
		table: table::Table<string::String, VaultStrategy>,
	}

	/// 增强的 Vault 结构
	struct DetailedVault has key, store, copy, drop {
		id: u64,
		config: VaultConfiguration,     // Vault配置
		strategy: VaultStrategy,        // 策略信息
		state: VaultState,             // 状态信息
		allocations: vector<Allocation>, // 资金分配
		activities: vector<VaultActivity>, // 活动记录
		created_at: u64,               // 创建时间
		updated_at: u64,               // 更新时间
	}

	/// Vault状态结构
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
        allocation_percentage: u64,     // 分配百分比（基点）
        apy: u64,                      // 年化收益率（基点）
		pool_id: vector<u8>,          // 资金池标识
		pool_token1: string::String,   // 资金池资产1
		pool_token2: string::String,   // 资金池资产2
		pool_token1_logo: string::String, // 资金池资产1 logo
		pool_token2_logo: string::String, // 资金池资产2 logo
    }

	/// 初始化表（仅合约部署时调用一次）
	public entry fun init(owner: &signer) {
		assert!(signer::address_of(owner) == @OathDefi, 100); // 仅合约部署者可初始化
		move_to(owner, OathTable { table: table::new<u64, Oath>(), next_id: 1 });
		move_to(owner, SBTTable { table: table::new<u64, SBT>(), next_id: 1 });
		move_to(owner, VaultTable { table: table::new<u64, DetailedVault>(), next_id: 1 });
	}

		/// 创建誓言
	public entry fun create_oath(
		creator: &signer,
		content: string::String,
		start_time: u64,
		end_time: u64,
		compensation_amount: u64,
		slashing_amount: u64,
		arbitration_type: u8,
		collateral_token_type: string::String,
		collateral_amount: u64,
		target_apy: Option<u64>,
		vault_id: Option<u64>,
	) acquires OathTable {
		let creator_addr = signer::address_of(creator);
		
		// 检查表是否已初始化
		assert!(exists<OathTable>(creator_addr), ERROR_NOT_INITIALIZED);

		let table_ref = borrow_global_mut<OathTable>(creator_addr);
		let current_id = table_ref.next_id;

		// 创建抵押物代币信息
		let collateral_token = CollateralToken {
			symbol: collateral_token_type,
			amount: collateral_amount,
			token_address: creator_addr, // 临时使用creator地址
			usd_value: collateral_amount, // 简化处理，假设1:1
		};

		// 创建补偿信息
		let compensation = CompensationInfo {
			total_compensation_pool: compensation_amount,
			distributed_amount: 0,
			pending_amount: compensation_amount,
			eligible_users: vector::empty<CompensationUser>(),
		};

		// 创建惩罚信息
		let slashing = SlashingInfo {
			slashed_amount: slashing_amount,
			slashing_reason: string::utf8(b"Default slashing"),
			slashing_time: start_time,
			arbitrator_address: creator_addr,
			arbitrator_fee: 0,
			protocol_fee: 0,
		};

		let oath = Oath {
			id: current_id,
			creator: creator_addr,
			content,
			category: string::utf8(b"default"),
			stable_collateral: collateral_amount,
			start_time,
			end_time,
			status: STATUS_ACTIVE,
			referenced_nfts: vector::empty<string::String>(),
			evidence: string::utf8(b""),
			is_over_collateralized: false,
			target_apy,
			current_apy: option::none<u64>(),
			vault_address: option::none<address>(), // vault_id被转换为vault_address
			collateral_tokens: vector::singleton(collateral_token),
			slashing_info: option::some(slashing),
			compensation_info: option::some(compensation),
		};

		table::add(&mut table_ref.table, current_id, oath);
		table_ref.next_id = current_id + 1;
	}

	/// 创建简单 Oath（不绑定 Vault）
	public entry fun create_simple_oath(
		creator: &signer,
		title: string::String,
		description: string::String,
		category: string::String,
		usdt_collateral: u64,
		deadline: u64
	) acquires OathTable {
		// 转换为新的格式
		let content = string::utf8(b"");
		string::append(&mut content, title);
		string::append_utf8(&mut content, b" - ");
		string::append(&mut content, description);
		
		create_oath(
			creator,
			content,
			0, // start_time
			deadline, // end_time
			0, // compensation_amount
			usdt_collateral, // slashing_amount
			1, // arbitration_type - 默认为社区仲裁
			string::utf8(b"USDT"), // collateral_token_type
			usdt_collateral, // collateral_amount
			option::none<u64>(), // target_apy
			option::none<u64>() // vault_id
		);
	}

	/// 检查并更新绑定 Vault 的 Oath 状态
	public entry fun check_and_update_oath_status(
		oath_owner: address,
		oath_id: u64,
		current_time: u64
	) acquires OathTable, VaultTable {
		let oath_table = borrow_global_mut<OathTable>(oath_owner);
		assert!(table::contains(&oath_table.table, oath_id), 107); // Oath 不存在
		
		let oath = table::borrow_mut(&mut oath_table.table, oath_id);
		assert!(oath.status == STATUS_ACTIVE, 108); // 只有活跃状态的 Oath 可以检查
		
		// 检查是否超过截止时间
		if (current_time > oath.end_time) {
			// 如果绑定了 Vault，检查收益率
			if (option::is_some(&oath.vault_address) && option::is_some(&oath.target_apy)) {
				let vault_address = *option::borrow(&oath.vault_address);
				let target_apy = *option::borrow(&oath.target_apy);
				
				let vault_table = borrow_global<VaultTable>(oath_owner);
				// 由于vault_address是地址而不是ID，我们需要遍历查找
				// 简化处理：假设使用vault_id 1
				let vault_id = 1; // 临时简化处理
				if (table::contains(&vault_table.table, vault_id)) {
					let vault = table::borrow(&vault_table.table, vault_id);
					if (vault.state.apy >= target_apy) {
						oath.status = STATUS_COMPLETED; // 达到目标收益率，完成
					} else {
						oath.status = STATUS_FAILED; // 未达到目标收益率，失败
					};
				} else {
					oath.status = STATUS_FAILED; // Vault 不存在，失败
				};
			} else {
				// 没有绑定 Vault，需要手动完成
				oath.status = STATUS_FAILED; // 超时失败
			};
		};
	}

	/// 批量检查并更新所有活跃 Oath 的状态
	public entry fun batch_check_oath_status(
		oath_owner: address,
		current_time: u64
	) acquires OathTable, VaultTable {
		let oath_table = borrow_global<OathTable>(oath_owner);
		let pending_ids = vector::empty<u64>();
		let i = 1;
		
		// 先收集需要检查的 Oath ID
		while (i < oath_table.next_id) {
			if (table::contains(&oath_table.table, i)) {
				let oath = table::borrow(&oath_table.table, i);
				if (oath.status == STATUS_ACTIVE && current_time > oath.end_time) {
					vector::push_back(&mut pending_ids, i);
				};
			};
			i = i + 1;
		};
		
		// 然后逐个检查和更新
		let j = 0;
		let len = vector::length(&pending_ids);
		while (j < len) {
			let oath_id = *vector::borrow(&pending_ids, j);
			check_and_update_oath_status(oath_owner, oath_id, current_time);
			j = j + 1;
		};
	}

	/// 完成 Oath 并铸造 SBT
	public entry fun complete_oath_and_mint_sbt(user: &signer, oath_id: u64, now: u64) acquires OathTable, SBTTable {
		let user_addr = signer::address_of(user);
		let table_ref = borrow_global_mut<OathTable>(user_addr);
		let oath = table::borrow_mut(&mut table_ref.table, oath_id);
		assert!(oath.creator == user_addr, 101); // 仅创建者可完成
		assert!(oath.status == STATUS_ACTIVE, 102);
		oath.status = STATUS_COMPLETED;

		let sbt_table = borrow_global_mut<SBTTable>(user_addr);
		let sbt_id = sbt_table.next_id;
		sbt_table.next_id = sbt_id + 1;
		let sbt = SBT {
			id: sbt_id,
			owner: user_addr,
			oath_id,
			minted_at: now,
		};
		table::add(&mut sbt_table.table, sbt_id, sbt);
	}

	/// 查询 Oath
	#[view]
	public fun get_oath(owner: address, oath_id: u64): Option<Oath> acquires OathTable {
		let table_ref = borrow_global<OathTable>(owner);
		if (table::contains(&table_ref.table, oath_id)) {
			let oath_ref = table::borrow(&table_ref.table, oath_id);
			let oath = *oath_ref;
			option::some(oath)
		} else {
			option::none<Oath>()
		}
	}

	/// 查询 SBT
	#[view]
	public fun get_sbt(owner: address, sbt_id: u64): Option<SBT> acquires SBTTable {
		let sbt_table = borrow_global<SBTTable>(owner);
		if (table::contains(&sbt_table.table, sbt_id)) {
			let sbt_ref = table::borrow(&sbt_table.table, sbt_id);
			let sbt = *sbt_ref;
			option::some(sbt)
		} else {
			option::none<SBT>()
		}
	}

	/// 创建 Vault
	public entry fun create_vault(
		creator: &signer,
		total_assets: u64,
		total_assets_usd: u64,
		apy: u64,
	) acquires VaultTable {
		let creator_addr = signer::address_of(creator);
		let table_ref = borrow_global_mut<VaultTable>(creator_addr);
		let id = table_ref.next_id;
		table_ref.next_id = id + 1;
		
		let vault = DetailedVault {
			id,
			config: VaultConfiguration {
				name: string::utf8(b"Default Vault"),
				symbol: string::utf8(b"DVAULT"),
				description: string::utf8(b"Default vault description"),
				strategy_id: string::utf8(b"default_strategy"),
				curator: creator_addr,
				timelock: 7, // 7 days
				guardian: option::none<address>(),
				fee_rate: 200,   // 2%
				performance_fee: 1000, // 10%
				markets: vector::empty<address>(),
			},
			strategy: VaultStrategy {
				id: string::utf8(b"default_strategy"),
				name: string::utf8(b"Default Strategy"),
				description: string::utf8(b"Default strategy description"),
				category: string::utf8(b"yield"),
				expected_apy: apy,
				risk_level: 2, // medium risk
				minimum_deposit: 100,
				lock_period: option::none<u64>(),
				features: vector::empty<string::String>(),
			},
			state: VaultState {
				apy,
				total_assets,
				total_assets_usd,
				total_supply: 0,
				share_price: 1000000, // 1.0 with 6 decimal places
				performance_fee_collected: 0,
			},
			allocations: vector::empty<Allocation>(),
			activities: vector::empty<VaultActivity>(),
			created_at: 0, // placeholder, in real implementation use timestamp
			updated_at: 0, // placeholder, in real implementation use timestamp
		};
		table::add(&mut table_ref.table, id, vault);
	}

	/// 添加资金分配到 Vault
	public entry fun add_allocation_to_vault(
		creator: &signer,
		vault_id: u64,
		market_key: vector<u8>,
		supply_assets: u64,
		supply_assets_usd: u64,
		apy: u64,
		pool_id: vector<u8>,
		pool_token1: string::String,
		pool_token2: string::String,
		pool_token1_logo: string::String,
		pool_token2_logo: string::String,
	) acquires VaultTable {
		let creator_addr = signer::address_of(creator);
		let table_ref = borrow_global_mut<VaultTable>(creator_addr);
		assert!(table::contains(&table_ref.table, vault_id), 105); // Vault 不存在
		
		let vault = table::borrow_mut(&mut table_ref.table, vault_id);
		// 仅允许Vault配置中的curator操作
		assert!(vault.config.curator == creator_addr, 106);
		
		let allocation = Allocation {
			market_address: creator_addr, // 使用创建者地址作为市场地址
			supply_assets,
			supply_assets_usd,
			allocation_percentage: 1000, // 10%
			apy,
			pool_id,
			pool_token1,
			pool_token2,
			pool_token1_logo,
			pool_token2_logo,
		};
		
		vector::push_back(&mut vault.allocations, allocation);
	}

	/// 更新 Vault 状态
	public entry fun update_vault_state(
		creator: &signer,
		vault_id: u64,
		total_assets: u64,
		total_assets_usd: u64,
		apy: u64,
	) acquires VaultTable {
		let creator_addr = signer::address_of(creator);
		let table_ref = borrow_global_mut<VaultTable>(creator_addr);
		assert!(table::contains(&table_ref.table, vault_id), 105);
		
		let vault = table::borrow_mut(&mut table_ref.table, vault_id);
		// 仅允许Vault配置中的curator操作
		assert!(vault.config.curator == creator_addr, 106);
		
		vault.state.total_assets = total_assets;
		vault.state.total_assets_usd = total_assets_usd;
		vault.state.apy = apy;
	}

	/// 查询 Vault 详情
	#[view]
	public fun get_vault(owner: address, vault_id: u64): Option<DetailedVault> acquires VaultTable {
		let table_ref = borrow_global<VaultTable>(owner);
		if (table::contains(&table_ref.table, vault_id)) {
			let vault_ref = table::borrow(&table_ref.table, vault_id);
			let vault = *vault_ref;
			option::some(vault)
		} else {
			option::none<DetailedVault>()
		}
	}

	/// 查询用户所有 Vault 列表
	#[view]
	public fun get_vault_list(owner: address): vector<DetailedVault> acquires VaultTable {
		let table_ref = borrow_global<VaultTable>(owner);
		let vault_list = vector::empty<DetailedVault>();
		let i = 1; // 从 ID 1 开始
		
		// 遍历所有可能的 vault ID（简化处理，实际应该维护一个 ID 列表）
		while (i < table_ref.next_id) {
			if (table::contains(&table_ref.table, i)) {
				let vault = *table::borrow(&table_ref.table, i);
				vector::push_back(&mut vault_list, vault);
			};
			i = i + 1;
		};
		
		vault_list
	}

	/// 查询 Vault 的分配详情
	#[view]
	public fun get_vault_allocations(owner: address, vault_id: u64): vector<Allocation> acquires VaultTable {
		let vault_opt = get_vault(owner, vault_id);
		if (option::is_some(&vault_opt)) {
			let vault = option::extract(&mut vault_opt);
			vault.allocations
		} else {
			vector::empty<Allocation>()
		}
	}

	/// 计算 Vault 总收益
	#[view]
	public fun calculate_vault_total_yield(owner: address, vault_id: u64): u64 acquires VaultTable {
		let vault_opt = get_vault(owner, vault_id);
		if (option::is_some(&vault_opt)) {
			let vault = option::extract(&mut vault_opt);
			// 计算年化收益：总资产 * APY / 10000
			(vault.state.total_assets_usd * vault.state.apy) / 10000
		} else {
			0
		}
	}

	/// 获取高收益 Vault 列表
	#[view]
	public fun get_high_yield_vaults(owner: address, min_apy: u64): vector<DetailedVault> acquires VaultTable {
		let all_vaults = get_vault_list(owner);
		let high_yield_vaults = vector::empty<DetailedVault>();
		let i = 0;
		let len = vector::length(&all_vaults);
		
		while (i < len) {
			let vault = *vector::borrow(&all_vaults, i);
			if (vault.state.apy >= min_apy) {
				vector::push_back(&mut high_yield_vaults, vault);
			};
			i = i + 1;
		};
		
		high_yield_vaults
	}

	/// 查询 Oath 绑定的 Vault 信息  
	#[view]
	public fun get_oath_vault_binding(oath_owner: address, oath_id: u64): (Option<address>, Option<u64>) acquires OathTable {
		let oath_opt = get_oath(oath_owner, oath_id);
		if (option::is_some(&oath_opt)) {
			let oath = option::extract(&mut oath_opt);
			(oath.vault_address, oath.target_apy)
		} else {
			(option::none<address>(), option::none<u64>())
		}
	}

	/// 检查 Oath 是否能达到目标收益率
	#[view]
	public fun check_oath_target_achievement(oath_owner: address, oath_id: u64): (bool, u64, u64) acquires OathTable, VaultTable {
		let oath_opt = get_oath(oath_owner, oath_id);
		if (option::is_some(&oath_opt)) {
			let oath = option::extract(&mut oath_opt);
			if (option::is_some(&oath.vault_address) && option::is_some(&oath.target_apy)) {
				let vault_address = *option::borrow(&oath.vault_address);
				let target_apy = *option::borrow(&oath.target_apy);
				
				let vault_table = borrow_global<VaultTable>(oath_owner);
				// 简化处理：假设使用vault_id 1
				let vault_id = 1; // 临时简化处理
				if (table::contains(&vault_table.table, vault_id)) {
					let vault = table::borrow(&vault_table.table, vault_id);
					let current_apy = vault.state.apy;
					let achieved = current_apy >= target_apy;
					(achieved, current_apy, target_apy)
				} else {
					(false, 0, target_apy)
				}
			} else {
				(false, 0, 0)
			}
		} else {
			(false, 0, 0)
		}
	}

	/// 获取所有绑定特定 Vault 的 Oath 列表
	#[view]
	public fun get_oaths_by_vault(oath_owner: address, vault_id: u64, vault_owner: address): vector<Oath> acquires OathTable {
		let oath_table = borrow_global<OathTable>(oath_owner);
		let bound_oaths = vector::empty<Oath>();
		let i = 1;
		
		while (i < oath_table.next_id) {
			if (table::contains(&oath_table.table, i)) {
				let oath = *table::borrow(&oath_table.table, i);
				if (option::is_some(&oath.vault_address)) {
					let oath_vault_address = *option::borrow(&oath.vault_address);
					// 简化处理：假设vault_address对应vault_id
					if (vault_id == 1) { // 简化逻辑
						vector::push_back(&mut bound_oaths, oath);
					};
				};
			};
			i = i + 1;
		};
		
		bound_oaths
	}

	/// 获取需要检查状态的 Oath 列表（即将到期或已到期的活跃 Oath）
	#[view]
	public fun get_pending_check_oaths(oath_owner: address, current_time: u64): vector<Oath> acquires OathTable {
		let oath_table = borrow_global<OathTable>(oath_owner);
		let pending_oaths = vector::empty<Oath>();
		let i = 1;
		
		while (i < oath_table.next_id) {
			if (table::contains(&oath_table.table, i)) {
				let oath = *table::borrow(&oath_table.table, i);
				if (oath.status == STATUS_ACTIVE && current_time >= oath.end_time) {
					vector::push_back(&mut pending_oaths, oath);
				};
			};
			i = i + 1;
		};
		
		pending_oaths
	}

	/// 获取用户所有誓言列表
	#[view]
	public fun get_oath_list(owner: address): vector<Oath> acquires OathTable {
		let oath_table = borrow_global<OathTable>(owner);
		let oath_list = vector::empty<Oath>();
		let i = 1; // 从 ID 1 开始
		
		// 遍历所有可能的 oath ID
		while (i < oath_table.next_id) {
			if (table::contains(&oath_table.table, i)) {
				let oath = *table::borrow(&oath_table.table, i);
				vector::push_back(&mut oath_list, oath);
			};
			i = i + 1;
		};
		
		oath_list
	}
}