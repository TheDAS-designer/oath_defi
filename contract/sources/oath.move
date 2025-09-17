module OathDefi::oath {
	use std::signer;
	use std::string;
	use std::option::{Self, Option};
	use std::table;

	/// Oath 状态
	const STATUS_ACTIVE: u8 = 0;     // 活跃中
	const STATUS_COMPLETED: u8 = 1;  // 已完成
	const STATUS_FAILED: u8 = 2;     // 已失败
	const STATUS_DISPUTED: u8 = 3;   // 争议中

	/// Oath 结构体
	struct Oath has key, store, copy {
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
	}

	/// SBT 结构体（不可转让）
	struct SBT has key, store, copy {
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

	/// 初始化表（仅合约部署时调用一次）
	public entry fun init(owner: &signer) {
		assert!(signer::address_of(owner) == @0x1, 100); // 仅合约部署者可初始化
		move_to(owner, OathTable { table: table::new<u64, Oath>(), next_id: 1 });
		move_to(owner, SBTTable { table: table::new<u64, SBT>(), next_id: 1 });
	}

	/// 创建 Oath
	public entry fun create_oath(
		creator: &signer,
		title: string::String,
		description: string::String,
		category: string::String,
		usdt_collateral: u64,
		deadline: u64
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
		};
		table::add(&mut table_ref.table, id, oath);
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
}