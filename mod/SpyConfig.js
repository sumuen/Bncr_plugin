let RspyList = {
    /* 监控信息配置 */
    SpyList: [
        {
            /* 任务名 确保任务名唯一性,因为id根据任务名计算生成*/ 
			Name: 'Spy测试1',
            /* 执行的脚本名 */
            Script: 'spy/test.js',
            /* 监听变量 */
            ListenEnv: ['jdzz', 'jdhb', 'mtgh'],
            /* 转换变量 */
            SetEnv: {
                jdzz: 'zhuanzhuan',
                jdhb: 'hongbao',
            },
            /* 超时退出 (秒)*/
            TimeOut: 0,
            /* 间隔时间(秒) */
            Interval: 30,
            /* 运行面板 0 代表 面板管理中的第一个容器 以此类推 */
            RunPanel: [0, 1, 2],
            /* 禁用任务 */
            Disable: false,
        },
		//以下给出几个示例
        {
            Name: '店铺抽奖通用活动-加密',
            Script: 'KingRan_KR/jd_luck_draw.js',
            ListenEnv: [
                // 'jd_task_wuxian_custom',
                // 'jd_task_hudong_custom',
                'LUCK_DRAW_URL',
            ],
            SetEnv: {
                // jd_task_hudong_custom: 'jd_task_wuxian_custom',
                LUCK_DRAW_URL: 'LUCK_DRAW_URL',
            },
            TimeOut: 50,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: '集卡抽奖通用活动',
            Script: 'KingRan_KR/jd_wxCollectCard.js',
            ListenEnv: ['M_WX_COLLECT_CARD_URL', 'jd_wxCollectCard_activityId'],
            SetEnv: {
                M_WX_COLLECT_CARD_URL: 'M_WX_COLLECT_CARD_URL',
                jd_wxCollectCard_activityId: 'jd_wxCollectCard_activityId',
            },
            TimeOut: 80,    
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: 'CJ组队瓜分京豆-加密	',
            Script: 'KingRan_KR/jd_cjzdgf.js',
            ListenEnv: ['jd_task_cjzlzd_custom', 'jd_cjhy_activityId', 'jd_zdjr_activityId', 'M_WX_TEAM_URL','jd_cjhy_activityUrl'],
            SetEnv: {
                jd_cjhy_activityId: 'jd_cjhy_activityId',
                jd_zdjr_activityId: 'jd_zdjr_activityId',
                jd_cjhy_activityUrl: 'jd_cjhy_activityUrl',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: '加购有礼 · 超级无线',
            Script: 'KingRan_KR/jd_wxCollectionActivity.js',
            ListenEnv: ['jd_wxCollectionActivity_activityUrl',],
            SetEnv: {
                jd_wxCollectionActivity_activityUrl: 'jd_wxCollectionActivity_activityUrl',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: '分享有礼',
            Script: 'KingRan_KR/jd_wxShareActivity.js',
            ListenEnv: ['jd_wxShareActivity_activityId',],
            SetEnv: {
                jd_wxShareActivity_activityId: 'jd_wxShareActivity_activityId',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: '购物车锦鲤通用活动',
            Script: 'KingRan_KR/jd_wxCartKoi.js',
            ListenEnv: ['jd_wxCartKoi_activityId',],
            SetEnv: {
                jd_wxCartKoi_activityId: 'jd_wxCartKoi_activityId',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {
            Name: 'LZ刮刮乐抽奖通用活动',
            Script: 'KingRan_KR/jd_drawCenter.js',
            ListenEnv: ['jd_drawCenter_activityId',],
            SetEnv: {
                jd_drawCenter_activityId: 'jd_drawCenter_activityId',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {   
            Name: 'LZ让福袋飞',
            Script: 'KingRan_KR/jd_wxUnPackingActivity.js',
            ListenEnv: ['jd_wxUnPackingActivity_activityId',],
            SetEnv: {
                jd_wxUnPackingActivity_activityId: 'jd_wxUnPackingActivity_activityId',
            },
            TimeOut: 0,
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {   
            Name: '关注店铺有礼',
            Script: 'KingRan_KR/jd_wxShopFollowActivity.js',
            ListenEnv: ['jd_wxShopFollowActivity_activityUrl',],
            SetEnv: {
                jd_wxShopFollowActivity_activityUrl: 'jd_wxShopFollowActivity_activityUrl',
            },
            TimeOut: 0, 
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {   
            Name: '加购有礼（lzkj_loreal）',
            Script: 'KingRan_KR/jd_lzkj_loreal_cart.js',
            ListenEnv: ['jd_lzkj_loreal_cart_url',],
            SetEnv: {
                jd_lzkj_loreal_cart_url: 'jd_lzkj_loreal_cart_url',
            },
            TimeOut: 0, 
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {   
            Name: '收藏大师-加购有礼）',
            Script: 'KingRan_KR/jd_txzj_cart_item.js',
            ListenEnv: ['jd_cart_item_activityUrl',],
            SetEnv: {
                jd_cart_item_activityUrl: 'jd_cart_item_activityUrl',
            },
            TimeOut: 0, 
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        {   
            Name: '收藏大师-关注有礼）',
            Script: 'KingRan_KR/jd_txzj_collect_item.js',
            ListenEnv: ['jd_collect_item_activityUrl',],
            SetEnv: {
                jd_collect_item_activityUrl: 'jd_collect_item_activityUrl',
            },
            TimeOut: 0, 
            Interval: 0,
            RunPanel: [0],
            Disable: false,
        },
        
    ],
    /* 监控列表 */
    ListenList: [
        {
            Name: '来薅线报通知',
            Id: '-1001749005484',
        },
        {
            Name: '备注2',
            Id: '-1001776658413',
        }
    ],

    //非静默触发消息多少秒撤回 0不撤回
    delMsgWaitTime: 10,
    //静默功能  默认false,会在监听到消息的地方回复监听结果 true则推送到静默推送设置的地方
    Taboo: true,
    TabooOriginalMsg: false /* 静默后推送的消息是否显示触发消息 */,
    //1 禁用任何日志输出 改为true后,不会向社交平台推送任何消息,且2 3开关失效 控制台除外
    DisableAllLogs: false,
    //2 禁用错误日志输出 改为true后,不会向社交平台推送任何错误消息 控制台除外
    DisableErrLogs: false,
    //3 禁用正常运行日志输出 改为true后,不会向社交平台推送任何任务运行成功的消息 控制台除外
    DisableRunLogs: false,
    //4 禁用控制台日志 改为true后,控制台不会显示任何消息
    DisableConsoleLog: false,
    //队列模式 1先进先出  2先进后出  其他值均视为 先进先出
    ListMode: 2,
    /* 运行日志输出位置,例如错误运行日志/任务运行成功等日志,只能设置1个 */
    runLogsInfo: {
        platform: 'HumanTG', //发送平台
        toGroupOrUser: 'userId', //通知类型,个人userId //群groupId
        Id: '1919577580', //个人id 或群id
    },
    /* 静默后监控结果输出位置  可填多个*/
    TabooLogsInfo: [
        // 	{
        // 	platform: "HumanTG",
        // 	toGroupOrUser: "groupId",   //通知类型,个人userId //群groupId
        // 	Id: "-1001744932665"
        // },
         {
             platform: 'HumanTG', //发送平台
             toGroupOrUser: 'userId', //通知类型,个人userId //群groupId
             Id: '1919577580', //个人id 或群id
         },
    ],
};


module.exports = {
    RspyList,
};
