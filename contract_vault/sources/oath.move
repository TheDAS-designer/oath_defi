module OathDefi::oath_vault {
	use std::signer;
	use std::string;
	use std::option::{Self, Option};
	use std::table;
	use std::vector;

	/// Oath 状态
	const STATUS_ACTIVE: u8 = 0;     // 活跃中
	const STATUS_COMPLETED: u8 = 1;  // 已完成
	const STATUS_FAILED: u8 = 2;     // 已失败
	const STATUS_DISPUTED: u8 = 3;   // 争议中

	/// Oath 结构体
	struct Oath has key, store, copy, drop {
		id: u64,
		creator: address, // 创建者地址
		title: string::String, // 标题
		description: string::String, // 描述
		category: string::String,// 类别
		usdt_collateral: u64,// USDT 抵押
		oath_collateral: u64,// Oath 抵押
		total_collateral: u64,// 总抵押
		deadline: u64, // 时间戳或天数
		status: u8,
		vault_id: Option<u64>, // 绑定的 Vault ID
		target_apy: Option<u64>, // 目标年化收益率（基点）
		vault_owner: Option<address>, // Vault 拥有者地址
	}

	/// SBT 结构体（不可转让）
	struct SBT has key, store, copy, drop {
		id: u64,
		owner: address,
		oath_id: u64,
		minted_at: u64,
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
		table: table::Table<u64, Vault>,
		next_id: u64,
	}

	/// Vault状态结构
    struct VaultState has store, copy, drop {
        apy: u64,           // 年化收益率 (基点表示, 6630 = 6.63%)
        total_assets: u64,  // 总资产数量
        total_assets_usd: u64, // 总资产USD价值
    }
    
    /// 资金分配结构
    struct Allocation has store, copy, drop {
        market_key: vector<u8>,  // 市场标识	
        supply_assets: u64,      // 投入资产
        supply_assets_usd: u64,  // 投入资产USD价值 tvlUSD
								// 持仓比例，前端计算
        apy: u64,         		 // 年化收益率
		pool_id: vector<u8>,    // 资金池标识
		pool_token1: string::String, // 资金池资产1
		pool_token2: string::String, // 资金池资产2
		pool_token1_logo: string::String, // 资金池资产1 logo
		pool_token2_logo: string::String, // 资金池资产2	logo
    }
    
    /// Vault结构
    struct Vault has key, store, copy, drop {
		id: u64,
        address: address,
        state: VaultState,
        allocations: vector<Allocation>,
    }

	/// 初始化表（仅合约部署时调用一次）
	public entry fun init(owner: &signer) {
		assert!(signer::address_of(owner) == @OathDefi, 100); // 仅合约部署者可初始化
		move_to(owner, OathTable { table: table::new<u64, Oath>(), next_id: 1 });
		move_to(owner, SBTTable { table: table::new<u64, SBT>(), next_id: 1 });
		move_to(owner, VaultTable { table: table::new<u64, Vault>(), next_id: 1 });
	}

	/// 创建 Oath
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
	) acquires OathTable {
		let oath_collateral = usdt_collateral; // 1:1 镜像
		let total_collateral = usdt_collateral + oath_collateral;
		let creator_addr = signer::address_of(creator);
		let table_ref = borrow_global_mut<OathTable>(creator_addr);
		let id = table_ref.next_id;
		table_ref.next_id = id + 1;
		let oath = Oath {
			id,
			creator: creator_addr,
			title,
			description,
			category,
			usdt_collateral,
			oath_collateral,
			total_collateral,
			deadline,
			status: STATUS_ACTIVE,
			vault_id,
			target_apy,
			vault_owner,
		};
		table::add(&mut table_ref.table, id, oath);
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
		create_oath(
			creator,
			title,
			description,
			category,
			usdt_collateral,
			deadline,
			option::none<u64>(),
			option::none<u64>(),
			option::none<address>()
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
		if (current_time > oath.deadline) {
			// 如果绑定了 Vault，检查收益率
			if (option::is_some(&oath.vault_id) && option::is_some(&oath.target_apy) && option::is_some(&oath.vault_owner)) {
				let vault_id = *option::borrow(&oath.vault_id);
				let target_apy = *option::borrow(&oath.target_apy);
				let vault_owner = *option::borrow(&oath.vault_owner);
				
				let vault_table = borrow_global<VaultTable>(vault_owner);
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
				if (oath.status == STATUS_ACTIVE && current_time > oath.deadline) {
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
		
		let vault = Vault {
			id,
			address: creator_addr,
			state: VaultState {
				apy,
				total_assets,
				total_assets_usd,
			},
			allocations: vector::empty<Allocation>(),
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
		assert!(vault.address == creator_addr, 106); // 仅创建者可操作
		
		let allocation = Allocation {
			market_key,
			supply_assets,
			supply_assets_usd,
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
		assert!(vault.address == creator_addr, 106);
		
		vault.state.total_assets = total_assets;
		vault.state.total_assets_usd = total_assets_usd;
		vault.state.apy = apy;
	}

	/// 查询 Vault 详情
	#[view]
	public fun get_vault(owner: address, vault_id: u64): Option<Vault> acquires VaultTable {
		let table_ref = borrow_global<VaultTable>(owner);
		if (table::contains(&table_ref.table, vault_id)) {
			let vault_ref = table::borrow(&table_ref.table, vault_id);
			let vault = *vault_ref;
			option::some(vault)
		} else {
			option::none<Vault>()
		}
	}

	/// 查询用户所有 Vault 列表
	#[view]
	public fun get_vault_list(owner: address): vector<Vault> acquires VaultTable {
		let table_ref = borrow_global<VaultTable>(owner);
		let vault_list = vector::empty<Vault>();
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
	public fun get_high_yield_vaults(owner: address, min_apy: u64): vector<Vault> acquires VaultTable {
		let all_vaults = get_vault_list(owner);
		let high_yield_vaults = vector::empty<Vault>();
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
	public fun get_oath_vault_binding(oath_owner: address, oath_id: u64): (Option<u64>, Option<u64>, Option<address>) acquires OathTable {
		let oath_opt = get_oath(oath_owner, oath_id);
		if (option::is_some(&oath_opt)) {
			let oath = option::extract(&mut oath_opt);
			(oath.vault_id, oath.target_apy, oath.vault_owner)
		} else {
			(option::none<u64>(), option::none<u64>(), option::none<address>())
		}
	}

	/// 检查 Oath 是否能达到目标收益率
	#[view]
	public fun check_oath_target_achievement(oath_owner: address, oath_id: u64): (bool, u64, u64) acquires OathTable, VaultTable {
		let oath_opt = get_oath(oath_owner, oath_id);
		if (option::is_some(&oath_opt)) {
			let oath = option::extract(&mut oath_opt);
			if (option::is_some(&oath.vault_id) && option::is_some(&oath.target_apy) && option::is_some(&oath.vault_owner)) {
				let vault_id = *option::borrow(&oath.vault_id);
				let target_apy = *option::borrow(&oath.target_apy);
				let vault_owner = *option::borrow(&oath.vault_owner);
				
				let vault_table = borrow_global<VaultTable>(vault_owner);
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
				if (option::is_some(&oath.vault_id) && option::is_some(&oath.vault_owner)) {
					let oath_vault_id = *option::borrow(&oath.vault_id);
					let oath_vault_owner = *option::borrow(&oath.vault_owner);
					if (oath_vault_id == vault_id && oath_vault_owner == vault_owner) {
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
				if (oath.status == STATUS_ACTIVE && current_time >= oath.deadline) {
					vector::push_back(&mut pending_oaths, oath);
				};
			};
			i = i + 1;
		};
		
		pending_oaths
	}
}