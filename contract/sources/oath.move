module OathDefi::oath_vault_v3 {
    use std::signer;
    use std::string;
    use std::option::{Self, Option};
    use std::vector;
    use aptos_framework::timestamp;
    use std::table::{Self, Table};
    
    // 导入类型定义
    use OathDefi::types::{
        Self as types, Oath, SBT, Vault
    };

    // 错误码常量
    const ERROR_NOT_INITIALIZED: u64 = 101;
    const ERROR_ALREADY_INITIALIZED: u64 = 102;
    const ERROR_OATH_NOT_FOUND: u64 = 103;
    const ERROR_VAULT_NOT_FOUND: u64 = 104;
    const ERROR_UNAUTHORIZED: u64 = 105;
    const ERROR_INVALID_STATUS: u64 = 106;
    const ERROR_OATH_EXPIRED: u64 = 107;
    const ERROR_INSUFFICIENT_COLLATERAL: u64 = 108;

    // ========== 资源结构 ==========

    /// Oath 表资源
    struct OathTable has key {
        oaths: Table<u64, Oath>,
        next_id: u64,
    }

    /// SBT 表资源  
    struct SBTTable has key {
        sbts: Table<u64, SBT>,
        next_id: u64,
    }

    /// Vault 表资源
    struct VaultTable has key {
        vaults: Table<u64, Vault>,
        next_id: u64,
    }

    // ========== 初始化函数 ==========

    /// 初始化 Oath 表
    public entry fun initialize_oath_table(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<OathTable>(account_addr), ERROR_ALREADY_INITIALIZED);
        
        move_to(account, OathTable {
            oaths: table::new<u64, Oath>(),
            next_id: 1,
        });
    }

    /// 初始化 SBT 表
    public entry fun initialize_sbt_table(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<SBTTable>(account_addr), ERROR_ALREADY_INITIALIZED);
        
        move_to(account, SBTTable {
            sbts: table::new<u64, SBT>(),
            next_id: 1,
        });
    }

    /// 初始化 Vault 表
    public entry fun initialize_vault_table(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<VaultTable>(account_addr), ERROR_ALREADY_INITIALIZED);
        
        move_to(account, VaultTable {
            vaults: table::new<u64, Vault>(),
            next_id: 1,
        });
    }

    // ========== Oath 相关函数 ==========

    /// 创建新的誓言
    public entry fun create_oath(
        account: &signer,
        description: string::String,
        target_amount: u64,
        deadline: u64
    ) acquires OathTable {
        let creator_addr = signer::address_of(account);
        assert!(exists<OathTable>(creator_addr), ERROR_NOT_INITIALIZED);
        
        let oath_table = borrow_global_mut<OathTable>(creator_addr);
        let id = oath_table.next_id;
        oath_table.next_id = id + 1;
        
        let oath = types::create_oath(
            id,
            creator_addr,
            description,
            string::utf8(b"default"),
            target_amount,
            timestamp::now_seconds(),
            deadline,
            types::get_status_active(),
            vector::empty<string::String>(),
            string::utf8(b""),
            false,
            option::none<u64>(),
            option::none<u64>(),
            option::none<address>(),
            vector::empty(),
            option::none(),
            option::none(),
        );
        
        table::add(&mut oath_table.oaths, id, oath);
    }

    /// 完成 Oath 并铸造 SBT
    public entry fun complete_oath_and_mint_sbt(
        account: &signer,
        oath_id: u64,
        evidence: string::String
    ) acquires OathTable, SBTTable {
        let user_addr = signer::address_of(account);
        
        // 更新 oath 状态
        assert!(exists<OathTable>(user_addr), ERROR_NOT_INITIALIZED);
        let oath_table = borrow_global_mut<OathTable>(user_addr);
        assert!(table::contains(&oath_table.oaths, oath_id), ERROR_OATH_NOT_FOUND);
        
        let oath = table::borrow_mut(&mut oath_table.oaths, oath_id);
        types::oath_set_status(oath, types::get_status_completed());
        types::oath_set_evidence(oath, evidence);
        
        // 创建 SBT
        assert!(exists<SBTTable>(user_addr), ERROR_NOT_INITIALIZED);
        let sbt_table = borrow_global_mut<SBTTable>(user_addr);
        let sbt_id = sbt_table.next_id;
        sbt_table.next_id = sbt_id + 1;
        
        let sbt = types::create_sbt(sbt_id, user_addr, oath_id, timestamp::now_seconds());
        table::add(&mut sbt_table.sbts, sbt_id, sbt);
    }

    // ========== Vault 相关函数 ==========

    /// 创建 Vault
    public entry fun create_vault(
        account: &signer,
        target_apy: u64,
        strategy: string::String,
        initial_deposit: u64
    ) acquires VaultTable {
        let creator_addr = signer::address_of(account);
        assert!(exists<VaultTable>(creator_addr), ERROR_NOT_INITIALIZED);
        
        let vault_table = borrow_global_mut<VaultTable>(creator_addr);
        let id = vault_table.next_id;
        vault_table.next_id = id + 1;
        
        // 创建 vault 组件
        let vault_strategy = types::create_vault_strategy(
            strategy,
            string::utf8(b""),
            0, // risk_level
            vector::empty<string::String>(),
            string::utf8(b"defi"),
            0, // min_duration
            0, // max_duration
            true, // auto_compound
            true, // emergency_exit
        );
        
        let vault_config = types::create_vault_configuration(
            string::utf8(b"default_vault"),
            string::utf8(b""),
            100, // min_deposit
            1000000, // max_deposit
            30, // lock_period
            target_apy,
            500, // performance_fee_rate (5%)
            100, // management_fee_rate (1%)
            creator_addr,
            true, // is_active
        );
        
        let vault_state = types::create_vault_state(
            target_apy,
            initial_deposit,
            initial_deposit,
            initial_deposit,
            1000000, // share_price (1.0 with 6 decimals)
            0, // performance_fee_collected
        );
        
        let vault = types::create_vault(
            id,
            creator_addr,
            vault_strategy,
            vault_config,
            vault_state,
            vector::empty(),
            vector::empty(),
        );
        
        table::add(&mut vault_table.vaults, id, vault);
    }

    // ========== 查询函数 ==========

    /// 获取 Oath
    #[view]
    public fun get_oath(owner: address, oath_id: u64): Option<Oath> acquires OathTable {
        if (!exists<OathTable>(owner)) {
            return option::none<Oath>()
        };
        
        let oath_table = borrow_global<OathTable>(owner);
        if (table::contains(&oath_table.oaths, oath_id)) {
            option::some(*table::borrow(&oath_table.oaths, oath_id))
        } else {
            option::none<Oath>()
        }
    }

    /// 获取 SBT
    #[view]
    public fun get_sbt(owner: address, sbt_id: u64): Option<SBT> acquires SBTTable {
        if (!exists<SBTTable>(owner)) {
            return option::none<SBT>()
        };
        
        let sbt_table = borrow_global<SBTTable>(owner);
        if (table::contains(&sbt_table.sbts, sbt_id)) {
            option::some(*table::borrow(&sbt_table.sbts, sbt_id))
        } else {
            option::none<SBT>()
        }
    }

    /// 获取 Vault
    #[view]
    public fun get_vault(owner: address, vault_id: u64): Option<Vault> acquires VaultTable {
        if (!exists<VaultTable>(owner)) {
            return option::none<Vault>()
        };
        
        let vault_table = borrow_global<VaultTable>(owner);
        if (table::contains(&vault_table.vaults, vault_id)) {
            option::some(*table::borrow(&vault_table.vaults, vault_id))
        } else {
            option::none<Vault>()
        }
    }

    /// 获取用户的所有 Oath（简化版本）
    #[view]
    public fun get_oath_count(owner: address): u64 acquires OathTable {
        if (!exists<OathTable>(owner)) {
            return 0
        };
        
        let oath_table = borrow_global<OathTable>(owner);
        oath_table.next_id - 1
    }

    /// 获取用户的所有 Vault 数量
    #[view]
    public fun get_vault_count(owner: address): u64 acquires VaultTable {
        if (!exists<VaultTable>(owner)) {
            return 0
        };
        
        let vault_table = borrow_global<VaultTable>(owner);
        vault_table.next_id - 1
    }

    /// 获取用户的所有 SBT 数量
    #[view]
    public fun get_sbt_count(owner: address): u64 acquires SBTTable {
        if (!exists<SBTTable>(owner)) {
            return 0
        };
        
        let sbt_table = borrow_global<SBTTable>(owner);
        sbt_table.next_id - 1
    }
}