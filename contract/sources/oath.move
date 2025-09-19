module OathDefi::oath_vault_v7 {
    use std::signer;
    use std::string;
    use std::option::{Self, Option};
    use std::vector;
    use aptos_framework::timestamp;
    use std::table::{Self, Table};
    
    // 导入类型定义
    use OathDefi::types_v7::{
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
        content: string::String,            // oathContent
        description: string::String,        // description
        category: string::String,           // selectedTemplate.category
        collateralAmount: u64,              // form.totalCollateralValue
        endTime: u64,                       // endTime
        vaultAddress: string::String,       // form.vaultAddress
        targetAPY: u64,                     // form.parameters.targetAPY
        collateralTokens: string::String,   // collateralTokens (JSON string) - 暂时保留
        categoryId: string::String,         // categoryId
    ) acquires OathTable {
        let creator_addr = signer::address_of(account);
        assert!(exists<OathTable>(creator_addr), ERROR_NOT_INITIALIZED);
        
        let oath_table = borrow_global_mut<OathTable>(creator_addr);
        let id = oath_table.next_id;
        oath_table.next_id = id + 1;
        
        // 构建 vault_address option  
        let vault_address_option = if (string::length(&vaultAddress) > 0) {
            // 注意：在实际应用中需要将字符串转换为地址
            // 这里使用占位符地址，实际需要解析 vaultAddress
            option::some(@0x1)
        } else {
            option::none<address>()
        };
        
        // 构建 target_apy option
        // 如果 targetAPY > 0 则设置值，否则为 none
        let target_apy_option = if (targetAPY > 0) {
            option::some(targetAPY)
        } else {
            option::none<u64>()
        };
        
        // 暂时创建空的 collateral tokens 数组
        // 在实际实现中，需要解析 collateralTokens 字符串
        let collateral_tokens_vec = vector::empty<types::CollateralToken>();
        
        let oath = types::create_oath(
            id,
            creator_addr,
            content,
            category,
            categoryId,
            collateralAmount,
            timestamp::now_seconds(),
            endTime,
            types::get_status_active(),
            vector::empty<string::String>(),
            description,
            false,
            target_apy_option,
            option::none<u64>(),
            vault_address_option,
            collateral_tokens_vec,
            option::none(),
            option::none(),
        );
        
        table::add(&mut oath_table.oaths, id, oath);
    }

    /// 确保 OathTable 存在，如果不存在则创建
    fun ensure_oath_table_exists(account: &signer) {
        let account_addr = signer::address_of(account);
        if (!exists<OathTable>(account_addr)) {
            move_to(account, OathTable {
                oaths: table::new<u64, Oath>(),
                next_id: 1,
            });
        }
    }

    /// 创建带有详细抵押代币信息的誓言
    public entry fun create_oath_with_tokens(
        account: &signer,
        content: string::String,                    // 誓言内容
        description: string::String,                // 描述
        category: string::String,                   // 分类
        collateralAmount: u64,                      // 总抵押价值
        endTime: u64,                               // 结束时间
        vaultAddress: string::String,               // Vault 地址
        targetAPY: u64,                             // 目标 APY
        categoryId: string::String,                 // 分类 ID
        // 抵押代币详细信息
        token_symbols: vector<string::String>,      // 代币符号列表
        token_amounts: vector<u64>,                 // 代币数量列表
        token_addresses: vector<string::String>,    // 代币地址列表
        token_usd_values: vector<u64>,              // 代币USD价值列表
    ) acquires OathTable {
        let creator_addr = signer::address_of(account);
        
        // 自动初始化 OathTable（如果不存在）
        ensure_oath_table_exists(account);
        
        let oath_table = borrow_global_mut<OathTable>(creator_addr);
        let id = oath_table.next_id;
        oath_table.next_id = id + 1;
        
        // 构建 vault_address option
        let vault_address_option = if (string::length(&vaultAddress) > 0) {
            option::some(@0x1) // 占位符地址
        } else {
            option::none<address>()
        };
        
        // 构建 target_apy option
        let target_apy_option = if (targetAPY > 0) {
            option::some(targetAPY)
        } else {
            option::none<u64>()
        };
        
        // 构建 collateral tokens 向量
        let collateral_tokens_vec = vector::empty<types::CollateralToken>();
        let len = vector::length(&token_symbols);
        let i = 0;
        while (i < len) {
            let symbol = *vector::borrow(&token_symbols, i);
            let amount = *vector::borrow(&token_amounts, i);
            let address = *vector::borrow(&token_addresses, i);
            let usd_value = *vector::borrow(&token_usd_values, i);
            
            let token = types::create_collateral_token(
                symbol,
                amount,
                address,
                usd_value,
                timestamp::now_seconds()
            );
            vector::push_back(&mut collateral_tokens_vec, token);
            i = i + 1;
        };
        
        let oath = types::create_oath(
            id,
            creator_addr,
            content,
            category,
            categoryId,
            collateralAmount,
            timestamp::now_seconds(),
            endTime,
            types::get_status_active(),
            vector::empty<string::String>(),
            description,
            false,
            target_apy_option,
            option::none<u64>(),
            vault_address_option,
            collateral_tokens_vec,
            option::none(),
            option::none(),
        );
        
        table::add(&mut oath_table.oaths, id, oath);
    }

    /// 为誓言添加抵押代币
    public entry fun add_collateral_tokens_to_oath(
        account: &signer,
        oath_id: u64,
        token_symbols: vector<string::String>,
        token_amounts: vector<u64>,
        token_addresses: vector<string::String>,
        token_usd_values: vector<u64>
    ) acquires OathTable {
        let user_addr = signer::address_of(account);
        assert!(exists<OathTable>(user_addr), ERROR_NOT_INITIALIZED);
        
        let oath_table = borrow_global_mut<OathTable>(user_addr);
        assert!(table::contains(&oath_table.oaths, oath_id), ERROR_OATH_NOT_FOUND);
        
        // 注意：由于 Move 的限制，我们无法直接修改 Oath 结构体中的 vector
        // 这个函数作为未来扩展的占位符
        // 实际实现可能需要重新设计数据结构
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
        initial_deposit: u64,
        vault_name: string::String,
        vault_symbol: string::String,
        vault_description: string::String,
        curator: string::String,
        timelock_days: u64,
        guardian_opt: bool, // 是否有 guardian
        guardian_value: string::String, // guardian 值（如果有的话）
        fee_rate: u64,
        performance_fee: u64,
        markets: vector<string::String>,
        market_addresses: vector<string::String>,
        allocation_percentages: vector<u64>,
        // VaultStrategy 参数
        strategy_name: string::String,
        strategy_description: string::String,
        risk_level: u8,
        supported_tokens: vector<string::String>,
        strategy_type: string::String,
        min_duration: u64,
        max_duration: u64,
        auto_compound: bool,
        emergency_exit: bool
    ) acquires VaultTable {
        let creator_addr = signer::address_of(account);
        assert!(exists<VaultTable>(creator_addr), ERROR_NOT_INITIALIZED);
        
        let vault_table = borrow_global_mut<VaultTable>(creator_addr);
        let id = vault_table.next_id;
        vault_table.next_id = id + 1;
        
        // 构建 guardian option
        let guardian = if (guardian_opt) {
            option::some(guardian_value)
        } else {
            option::none<string::String>()
        };
        
        // 构建 market allocations
        let allocations = vector::empty<types::MarketAllocation>();
        let i = 0;
        let len = vector::length(&market_addresses);
        while (i < len) {
            let market_addr = *vector::borrow(&market_addresses, i);
            let percentage = *vector::borrow(&allocation_percentages, i);
            let allocation = types::create_market_allocation(market_addr, percentage);
            vector::push_back(&mut allocations, allocation);
            i = i + 1;
        };
        
        // 创建 vault 组件
        let vault_strategy = types::create_vault_strategy(
            strategy_name,
            strategy_description,
            risk_level,
            supported_tokens,
            strategy_type,
            min_duration,
            max_duration,
            auto_compound,
            emergency_exit,
        );
        
        let vault_config = types::create_vault_configuration(
            vault_name,
            vault_symbol,
            vault_description,
            strategy,
            curator,
            timelock_days,
            guardian,
            fee_rate,
            performance_fee,
            markets,
            allocations,
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