const { AptosClient, AptosAccount, HexString } = require("aptos");
const fetch = require('node-fetch');

// 配置
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const CONTRACT_ADDRESS = "0xdf32eca75a3aaf80cd45c6cf410e11606e911f1eb24627538bbb4969f3d09582";
const MODULE_NAME = "oath_vault_v7";
const EVENT_TYPE = "OathCreatedEvent";

// 创建客户端
const client = new AptosClient(NODE_URL);

// 完整的事件类型
const FULL_EVENT_TYPE = `${CONTRACT_ADDRESS}::${MODULE_NAME}::${EVENT_TYPE}`;

class OathEventListener {
    constructor() {
        this.isRunning = false;
        this.lastSequenceNumber = null;
        this.pollInterval = 2000; // 2秒轮询一次
    }

    // 格式化时间戳
    formatTimestamp(timestamp) {
        return new Date(parseInt(timestamp) * 1000).toLocaleString('zh-CN');
    }

    // 格式化事件数据
    formatEventData(eventData) {
        const data = eventData.data;
        return {
            誓言ID: data.id,
            创建者: data.creator,
            内容: data.content,
            分类: data.category,
            分类ID: data.category_id,
            开始时间: this.formatTimestamp(data.start_time),
            结束时间: this.formatTimestamp(data.end_time),
            稳定币抵押: `${data.stable_collateral} 单位`,
            抵押代币数量: data.collateral_tokens_count,
            是否过度抵押: data.is_over_collateralized,
            关联Vault: data.has_vault_address ? '是' : '否',
            目标APY: data.target_apy?.vec?.[0] ? `${data.target_apy.vec[0] / 100}%` : '未设置',
            状态: data.status,
            证据描述: data.evidence,
            事件版本: eventData.version,
            事件时间: this.formatTimestamp(eventData.timestamp)
        };
    }

    // 打印分隔线
    printSeparator() {
        console.log('='.repeat(80));
    }

    // 打印事件信息
    printEvent(event) {
        this.printSeparator();
        console.log(`🎉 检测到新的 OathCreatedEvent！`);
        console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
        this.printSeparator();
        
        const formatted = this.formatEventData(event);
        
        // 基本信息
        console.log(`📋 基本信息:`);
        console.log(`   誓言ID: ${formatted.誓言ID}`);
        console.log(`   创建者: ${formatted.创建者}`);
        console.log(`   内容: ${formatted.内容}`);
        console.log(`   分类: ${formatted.分类} (ID: ${formatted.分类ID})`);
        console.log();
        
        // 时间信息
        console.log(`⏰ 时间信息:`);
        console.log(`   开始时间: ${formatted.开始时间}`);
        console.log(`   结束时间: ${formatted.结束时间}`);
        console.log();
        
        // 抵押信息
        console.log(`💰 抵押信息:`);
        console.log(`   稳定币抵押: ${formatted.稳定币抵押}`);
        console.log(`   抵押代币数量: ${formatted.抵押代币数量}`);
        console.log(`   是否过度抵押: ${formatted.是否过度抵押}`);
        console.log();
        
        // Vault 信息
        console.log(`🏦 Vault信息:`);
        console.log(`   关联Vault: ${formatted.关联Vault}`);
        console.log(`   目标APY: ${formatted.目标APY}`);
        console.log();
        
        // 状态信息
        console.log(`📊 状态信息:`);
        console.log(`   当前状态: ${formatted.状态}`);
        console.log(`   证据描述: ${formatted.证据描述}`);
        console.log();
        
        // 事件元数据
        console.log(`🔍 事件元数据:`);
        console.log(`   事件版本: ${formatted.事件版本}`);
        console.log(`   事件时间: ${formatted.事件时间}`);
        
        this.printSeparator();
    }

    // 获取最新的 OathCreatedEvent 事件
    async fetchLatestEvents() {
        try {
            // 使用正确的 API 方法
            const response = await client.getEventsByEventHandle(
                CONTRACT_ADDRESS,
                FULL_EVENT_TYPE,
                "events",
                {
                    limit: 10
                }
            );

            return response;
        } catch (error) {
            // 尝试另一种方法
            try {
                const accountModules = await client.getAccountModules(CONTRACT_ADDRESS);
                console.log(`🔍 尝试通过事件查询获取数据...`);
                
                // 使用账户事件查询
                const events = await client.getEventsByCreationNumber(
                    CONTRACT_ADDRESS,
                    "0", // creation number
                    {
                        limit: 10
                    }
                );
                
                // 过滤出 OathCreatedEvent
                const filteredEvents = events.filter(event => 
                    event.type && event.type.includes("OathCreatedEvent")
                );
                
                return filteredEvents;
            } catch (innerError) {
                // 最后尝试使用 GraphQL 查询
                // 
                console.log("error",innerError)
                //return await this.fetchEventsViaGraphQL();
            }
        }
    }

    // 通过 GraphQL 获取事件（备用方法）
    async fetchEventsViaGraphQL() {
        try {
            const query = `
                query GetOathCreatedEvents($limit: Int) {
                    events(
                        where: {
                            type: {_eq: "${FULL_EVENT_TYPE}"}
                        }
                        order_by: {transaction_version: desc}
                        limit: $limit
                    ) {
                        sequence_number
                        creation_number
                        account_address
                        type
                        data
                        transaction_version
                        transaction_block_height
                        indexed_type
                    }
                }
            `;

            const response = await fetch('https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { limit: 10 }
                })
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
            }

            return result.data?.events || [];
        } catch (error) {
            console.error(`❌ GraphQL 查询失败:`, error.message);
            return [];
        }
    }

    // 检查新事件
    async checkForNewEvents() {
        try {
            const events = await this.fetchLatestEvents();
            
            if (events.length === 0) {
                return;
            }

            // 如果这是第一次运行，记录最新事件的序列号
            if (this.lastSequenceNumber === null) {
                this.lastSequenceNumber = parseInt(events[0].sequence_number);
                console.log(`🚀 开始监听 OathCreatedEvent...`);
                console.log(`📍 当前最新事件序列号: ${this.lastSequenceNumber}`);
                this.printSeparator();
                return;
            }

            // 查找新事件（序列号大于上次记录的）
            const newEvents = events.filter(event => 
                parseInt(event.sequence_number) > this.lastSequenceNumber
            );

            if (newEvents.length > 0) {
                // 按序列号升序排列新事件
                newEvents.sort((a, b) => 
                    parseInt(a.sequence_number) - parseInt(b.sequence_number)
                );

                // 处理每个新事件
                for (const event of newEvents) {
                    this.printEvent(event);
                    this.lastSequenceNumber = parseInt(event.sequence_number);
                }
            }

        } catch (error) {
            console.error(`❌ 检查新事件时出错:`, error.message);
        }
    }

    // 开始监听
    async start() {
        if (this.isRunning) {
            console.log(`⚠️  监听器已在运行中...`);
            return;
        }

        this.isRunning = true;
        console.log(`🎯 OathCreatedEvent 实时监听器启动`);
        console.log(`📡 合约地址: ${CONTRACT_ADDRESS}`);
        console.log(`📦 模块名称: ${MODULE_NAME}`);
        console.log(`🎪 事件类型: ${EVENT_TYPE}`);
        console.log(`⏱️  轮询间隔: ${this.pollInterval}ms`);
        console.log(`🌐 节点URL: ${NODE_URL}`);
        this.printSeparator();

        // 初始化检查
        await this.checkForNewEvents();

        // 设置定时轮询
        const intervalId = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(intervalId);
                return;
            }
            await this.checkForNewEvents();
        }, this.pollInterval);

        // 设置优雅退出
        process.on('SIGINT', () => {
            console.log(`\n🛑 收到中断信号，正在停止监听器...`);
            this.stop();
            clearInterval(intervalId);
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log(`\n🛑 收到终止信号，正在停止监听器...`);
            this.stop();
            clearInterval(intervalId);
            process.exit(0);
        });
    }

    // 停止监听
    stop() {
        this.isRunning = false;
        console.log(`📴 OathCreatedEvent 监听器已停止`);
    }

    // 获取监听器状态
    getStatus() {
        return {
            running: this.isRunning,
            lastSequenceNumber: this.lastSequenceNumber,
            pollInterval: this.pollInterval,
            eventType: FULL_EVENT_TYPE
        };
    }
}

// 创建并启动监听器
async function main() {
    console.log(`🚀 OathCreatedEvent 实时监听器`);
    console.log(`📅 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log();

    const listener = new OathEventListener();
    
    try {
        await listener.start();
        
        // 保持程序运行
        console.log(`✅ 监听器正在运行... 按 Ctrl+C 退出`);
        
        // 每30秒打印一次状态信息
        setInterval(() => {
            const status = listener.getStatus();
            if (status.running) {
                console.log(`💓 监听器运行中... 最新序列号: ${status.lastSequenceNumber || '初始化中'} (${new Date().toLocaleString('zh-CN')})`);
            }
        }, 30000);
        
    } catch (error) {
        console.error(`❌ 启动监听器失败:`, error);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error(`❌ 程序运行出错:`, error);
        process.exit(1);
    });
}

module.exports = { OathEventListener };