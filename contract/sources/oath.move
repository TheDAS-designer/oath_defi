module OathDefi::oath_vault_v7 {
    use std::signer;
    use std::string;
    use std::option::{Self, Option};
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
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

    /// 全局 Oath 注册表（用于跟踪所有用户的 Oath）
    struct GlobalOathRegistry has key {
        oath_records: Table<u64, OathRecord>, // 全局 Oath 记录
        next_global_id: u64,
    }

    /// Oath 记录结构（包含用户地址和用户本地 ID）
    struct OathRecord has store, copy, drop {
        owner: address,        // Oath 所有者地址
        local_id: u64,        // 用户本地的 Oath ID
        global_id: u64,       // 全局唯一 ID
        created_at: u64,      // 创建时间
    }

    // ========== 事件结构体 ==========

    /// Oath 创建事件
    /// 当用户成功创建新的誓言时触发
    #[event]
    struct OathCreatedEvent has drop, store {
        // 基本信息
        id: u64,                                    // 誓言唯一标识符
        creator: address,                           // 创建者地址
        content: string::String,                    // 誓言内容描述
        category: string::String,                   // 誓言分类
        category_id: string::String,                // 誓言分类 ID
        
        // 时间信息
        start_time: u64,                            // 誓言开始时间戳
        end_time: u64,                              // 誓言结束时间戳
        
        // 抵押相关
        stable_collateral: u64,                     // 稳定币抵押数量
        collateral_tokens_count: u64,               // 抵押代币数量
        is_over_collateralized: bool,               // 是否过度抵押
        
        // Vault 集成
        has_vault_address: bool,                    // 是否关联 Vault
        target_apy: Option<u64>,                    // 目标年化收益率（基点）
        
        // 状态
        status: u8,                                 // 誓言状态
        evidence: string::String,                   // 初始证据描述
    }

    /// Oath 状态更新事件
    /// 当誓言状态发生变化时触发
    #[event]
    struct OathStatusUpdatedEvent has drop, store {
        id: u64,                                    // 誓言 ID
        creator: address,                           // 创建者地址
        old_status: u8,                             // 原状态
        new_status: u8,                             // 新状态
        evidence: string::String,                   // 更新证据
        timestamp: u64,                             // 更新时间戳
    }

    /// SBT 铸造事件
    /// 当用户完成誓言并铸造 SBT 时触发
    #[event]
    struct SBTMintedEvent has drop, store {
        sbt_id: u64,                                // SBT ID
        owner: address,                             // SBT 持有者
        oath_id: u64,                               // 对应的誓言 ID
        mint_time: u64,                             // 铸造时间戳
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

    /// 初始化全局 Oath 注册表（只能由模块发布者调用）
    public entry fun initialize_global_oath_registry(account: &signer) {
        let account_addr = signer::address_of(account);
        // 只有合约部署者可以初始化全局注册表
        assert!(account_addr == @OathDefi, ERROR_UNAUTHORIZED);
        assert!(!exists<GlobalOathRegistry>(account_addr), ERROR_ALREADY_INITIALIZED);
        
        move_to(account, GlobalOathRegistry {
            oath_records: table::new<u64, OathRecord>(),
            next_global_id: 1,
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

        // 触发 Oath 创建事件
        let oath_created_event = OathCreatedEvent {
            id,
            creator: creator_addr,
            content,
            category,
            category_id: categoryId,
            start_time: timestamp::now_seconds(),
            end_time: endTime,
            stable_collateral: collateralAmount,
            collateral_tokens_count: 0, // collateral_tokens_count - 当前为空数组
            is_over_collateralized: false, // is_over_collateralized
            has_vault_address: option::is_some(&vault_address_option), // has_vault_address
            target_apy: target_apy_option,
            status: types::get_status_active(),
            evidence: description,
        };
        
        event::emit(oath_created_event);
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
    ) acquires OathTable, GlobalOathRegistry {
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

        // 触发 Oath 创建事件
        let oath_created_event = OathCreatedEvent {
            id,
            creator: creator_addr,
            content,
            category,
            category_id: categoryId,
            start_time: timestamp::now_seconds(),
            end_time: endTime,
            stable_collateral: collateralAmount,
            collateral_tokens_count: vector::length(&collateral_tokens_vec), // collateral_tokens_count
            is_over_collateralized: false, // is_over_collateralized
            has_vault_address: option::is_some(&vault_address_option), // has_vault_address
            target_apy: target_apy_option,
            status: types::get_status_active(),
            evidence: description,
        };
        
        event::emit(oath_created_event);
        
        // 将 Oath 记录添加到全局注册表
        add_oath_to_global_registry(creator_addr, id);
    }

    /// 将 Oath 添加到全局注册表
    fun add_oath_to_global_registry(owner: address, local_id: u64) acquires GlobalOathRegistry {
        // 确保全局注册表存在
        if (!exists<GlobalOathRegistry>(@OathDefi)) {
            return // 如果全局注册表不存在，跳过注册（可以考虑抛出错误）
        };
        
        let registry = borrow_global_mut<GlobalOathRegistry>(@OathDefi);
        let global_id = registry.next_global_id;
        registry.next_global_id = global_id + 1;
        
        let record = OathRecord {
            owner,
            local_id,
            global_id,
            created_at: timestamp::now_seconds(),
        };
        
        table::add(&mut registry.oath_records, global_id, record);
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
        let old_status = types::oath_get_status(oath);
        types::oath_set_status(oath, types::get_status_completed());
        types::oath_set_evidence(oath, evidence);

        // 触发 Oath 状态更新事件
        let status_updated_event = OathStatusUpdatedEvent {
            id: oath_id,
            creator: user_addr,
            old_status,
            new_status: types::get_status_completed(),
            evidence,
            timestamp: timestamp::now_seconds(),
        };
        event::emit(status_updated_event);
        
        // 创建 SBT
        assert!(exists<SBTTable>(user_addr), ERROR_NOT_INITIALIZED);
        let sbt_table = borrow_global_mut<SBTTable>(user_addr);
        let sbt_id = sbt_table.next_id;
        sbt_table.next_id = sbt_id + 1;
        
        let sbt = types::create_sbt(sbt_id, user_addr, oath_id, timestamp::now_seconds());
        table::add(&mut sbt_table.sbts, sbt_id, sbt);

        // 触发 SBT 铸造事件
        let sbt_minted_event = SBTMintedEvent {
            sbt_id,
            owner: user_addr,
            oath_id,
            mint_time: timestamp::now_seconds(),
        };
        event::emit(sbt_minted_event);
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

    /// 获取全局 Oath 记录总数
    #[view]
    public fun get_global_oath_count(): u64 acquires GlobalOathRegistry {
        if (!exists<GlobalOathRegistry>(@OathDefi)) {
            return 0
        };
        
        let registry = borrow_global<GlobalOathRegistry>(@OathDefi);
        registry.next_global_id - 1
    }

    /// 获取全局 Oath 记录列表（分页）
    #[view] 
    public fun get_global_oath_records(
        start_id: u64,
        limit: u64
    ): vector<OathRecord> acquires GlobalOathRegistry {
        let records = vector::empty<OathRecord>();
        
        if (!exists<GlobalOathRegistry>(@OathDefi)) {
            return records
        };
        
        let registry = borrow_global<GlobalOathRegistry>(@OathDefi);
        let max_id = registry.next_global_id - 1;
        let end_id = if (start_id + limit > max_id) { max_id } else { start_id + limit };
        
        let current_id = start_id;
        while (current_id <= end_id && vector::length(&records) < limit) {
            if (table::contains(&registry.oath_records, current_id)) {
                let record = *table::borrow(&registry.oath_records, current_id);
                vector::push_back(&mut records, record);
            };
            current_id = current_id + 1;
        };
        
        records
    }

    /// 根据全局记录获取具体的 Oath 数据
    #[view]
    public fun get_oath_by_global_id(global_id: u64): Option<Oath> acquires GlobalOathRegistry, OathTable {
        if (!exists<GlobalOathRegistry>(@OathDefi)) {
            return option::none<Oath>()
        };
        
        let registry = borrow_global<GlobalOathRegistry>(@OathDefi);
        if (!table::contains(&registry.oath_records, global_id)) {
            return option::none<Oath>()
        };
        
        let record = table::borrow(&registry.oath_records, global_id);
        get_oath(record.owner, record.local_id)
    }

    /// 获取用户的 Vault 列表（指定范围）
    #[view]
    public fun get_vault_list(owner: address, start_id: u64, limit: u64): vector<Vault> acquires VaultTable {
        let result = vector::empty<Vault>();
        
        if (!exists<VaultTable>(owner)) {
            return result
        };
        
        let vault_table = borrow_global<VaultTable>(owner);
        let max_id = vault_table.next_id - 1;
        let end_id = if (start_id + limit > max_id) { max_id } else { start_id + limit - 1 };
        
        let i = start_id;
        while (i <= end_id && i > 0) {
            if (table::contains(&vault_table.vaults, i)) {
                let vault = *table::borrow(&vault_table.vaults, i);
                vector::push_back(&mut result, vault);
            };
            i = i + 1;
        };
        
        result
    }

    /// 获取用户的所有 Vault 列表
    #[view]
    public fun get_all_vaults(owner: address): vector<Vault> acquires VaultTable {
        if (!exists<VaultTable>(owner)) {
            return vector::empty<Vault>()
        };
        
        let vault_table = borrow_global<VaultTable>(owner);
        let max_id = vault_table.next_id - 1;
        
        get_vault_list(owner, 1, max_id)
    }

    /// 获取用户的 Oath 列表（指定范围）
    #[view]
    public fun get_oath_list(owner: address, start_id: u64, limit: u64): vector<Oath> acquires OathTable {
        let result = vector::empty<Oath>();
        
        if (!exists<OathTable>(owner)) {
            return result
        };
        
        let oath_table = borrow_global<OathTable>(owner);
        let max_id = oath_table.next_id - 1;
        let end_id = if (start_id + limit > max_id) { max_id } else { start_id + limit - 1 };
        
        let i = start_id;
        while (i <= end_id && i > 0) {
            if (table::contains(&oath_table.oaths, i)) {
                let oath = *table::borrow(&oath_table.oaths, i);
                vector::push_back(&mut result, oath);
            };
            i = i + 1;
        };
        
        result
    }

    /// 获取用户的所有 Oath 列表
    #[view]
    public fun get_all_oaths(owner: address): vector<Oath> acquires OathTable {
        if (!exists<OathTable>(owner)) {
            return vector::empty<Oath>()
        };
        
        let oath_table = borrow_global<OathTable>(owner);
        let max_id = oath_table.next_id - 1;
        
        get_oath_list(owner, 1, max_id)
    }
}