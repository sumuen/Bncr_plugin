/**
 * @author muzi
 * @name ntqq
 * @origin muzi
 * @version 1.0.1
 * @description 外置ntqq机器人适配器
 * @adapter true
 * @public true
 * @disable false
 * @priority 100
 * @systemVersion >=:2.0.5
 * @classification ["adapter"]
 */
/* 配置构造器 */
const jsonSchema = BncrCreateSchema.object({
    enable: BncrCreateSchema.boolean().setTitle('是否开启适配器').setDescription(`设置为关则不加载该适配器`).setDefault(false),
});

/* 配置管理器 */
const ConfigDB = new BncrPluginConfig(jsonSchema);

module.exports = async () => {
    await ConfigDB.get();
    /* 如果用户未配置,userConfig则为空对象{} */
    if (!Object.keys(ConfigDB.userConfig).length) {
        sysMethod.startOutLogs('未配置ntqq适配器,退出.');
        return;
    }
    if (!ConfigDB?.userConfig?.enable) return sysMethod.startOutLogs('未启用外置ntqq 退出.');
    let ntqq = new Adapter('ntqq');
    await ws(ntqq);
    return ntqq;
}
async function ws(ntqq) {
    const events = require('events');
    const eventS = new events.EventEmitter();
    const { randomUUID } = require('crypto');
    const listArr = [];
    let pingInterval;
    let pongTimeout;
    function heartbeat() {
        console.log('ntqqws心跳检测');
        clearTimeout(pongTimeout); // 清除上一次设置的pong检测

        // 每隔10秒发送一次ping，用于检测WebSocket连接是否正常
        pingInterval = setInterval(() => {
            // 检测如果WebSocket的readyState不在OPEN状态，则清除定时器，关闭连接
            if (ws.readyState !== ws.OPEN) {
                clearInterval(pingInterval);
                ws.close();
            } else {
                ws.ping(); // 发送ping
                // 设置一个延迟等待时间，比如5秒，如果5秒内没有收到pong响应，则判断连接已断开
                pongTimeout = setTimeout(() => {
                    clearInterval(pingInterval);
                    ws.close(); // 主动关闭连接
                    ws = new WebSocket(ws.url); // 重新连接
                    ws.on('open', heartbeat); // 在WebSocket连接成功后开始心跳检测
                    ws.on('ping', heartbeat); // 每次收到ping，也触发心跳函数，用于重置pong的等待时间
                    ws.on('pong', heartbeat); // 每次收到pong，触发心跳函数，用于清除pong的等待时间
                }, 5000);
            }
        }, 10000);
    }
    /* ws监听地址  ws://192.168.3.6:8080/api/bot/ntqqws */
    router.ws('/api/bot/ntqqws', ws => {
        ws.on('open', heartbeat); // 在WebSocket连接成功后开始心跳检测
        ws.on('ping', heartbeat); // 每次收到ping，也触发心跳函数，用于重置pong的等待时间
        ws.on('pong', heartbeat); // 每次收到pong，触发心跳函数，用于清除pong的等待时间
        ws.on('close', () => {
            clearInterval(pingInterval); // 清除ping定时器
            clearTimeout(pongTimeout); // 清除pong等待时间
        });
        ws.on('message', msg => {
            const body = JSON.parse(msg);
            /* 拒绝心跳链接消息 */
            if (body.post_type === 'meta_event') return;
            //检查是否为notice消息
            if (body.post_type === 'notice') {
                if (body.notice_type === 'group_recall') {
                    let msgInfo = {
                        userId: body.user_id + '' || '',
                        groupId: body.group_id ? body.group_id + '' : '0',
                        msg: `[group_recall]&operator_id=${body.operator_id || ""}`,
                        msgId: body.message_id + '' || '',

                    };
                    console.log('msg', msg, '最终消息：', msgInfo);
                    ntqq.receive(msgInfo);
                }
                return;
            }
            /* 不是消息退出 */
            if (!body.post_type || body.post_type !== 'message') return;
            if (body.post_type !== 'meta_event' || body.meta_event_type !== 'heartbeat') {
                let msgdata = (body.message.length > 0) ? body.message[0].data : body;
                console.log('收到ntqqws请求', msgdata);
            }
            //区分msg为text/image
            if (body.message[0].type === 'text') {
                msgcontent = body.message[0].data.text;
            }
            if (body.message[0].type === 'image') {
                msgcontent = body.message[0].data.file;
            }
            if (body.message[0].type === 'audio') {
                msgcontent = body.message[0].data.file;
            }
            let msgInfo = {
                userId: body.user_id + '' || '',
                userName: body.sender.nickname || '',  
                groupId: body.group_id ? body.group_id + '' : '0',
                groupName: body.group_name || '',  
                msg: msgcontent || '',
                msgId: body.message_id + '' || '',
            };

            console.log('msg', msg, '最终消息：', msgInfo);
            ntqq.receive(msgInfo);
        });
        /* 发送消息方法 */
        ntqq.reply = async function (replyInfo) {
            try {
                let uuid = randomUUID();
                let body = {
                    action: 'send_msg',
                    params: {
                        message: [] // 初始化消息内容数组
                    },
                    echo: uuid,
                };
                // 判断发送的消息类型，并设置相应的detail_type和ID
                if (replyInfo.groupId && replyInfo.groupId !== '0') {
                    body.params.detail_type = 'group';
                    body.params.group_id = parseInt(replyInfo.groupId, 10);
                } else {
                    body.params.detail_type = 'private';
                    body.params.user_id = parseInt(replyInfo.userId, 10);
                }

                // 根据消息类型，设置消息内容
                if (replyInfo.type === 'text') {
                    body.params.message.push({
                        "type": "text",
                        "data": {
                            "text": replyInfo.msg
                        }
                    });
                } else if (replyInfo.type === 'image') {
                    body.params.message.push({
                        "type": "image",
                        "data": {
                            "file": replyInfo.path
                        }
                    });
                } else if (replyInfo.type === 'record') {
                    body.params.message.push({
                        "type": "record",
                        "data": {
                            "file": replyInfo.path
                        }
                    });
                }
                //console.log(body);
                ws.send(JSON.stringify(body));
                return new Promise((resolve, reject) => {
                    listArr.push({ uuid, eventS });
                    let timeoutID = setTimeout(() => {
                        delListens(uuid);
                        eventS.emit(uuid, '');
                    }, 3 * 1000);
                    eventS.once(uuid, res => {
                        try {
                            delListens(uuid);
                            clearTimeout(timeoutID);
                            resolve(res || '');
                        } catch (e) {
                            console.error(e);
                        }
                    });
                });
            } catch (e) {
                console.error('ntqq:发送消息失败', e);
            }
        };

        /* 推送消息 */
        ntqq.push = async function (replyInfo) {
            if (replyInfo.api) {
                //api 是多传递的参数用于踢人，见nomanpussy
                return await this.delMsg(replyInfo);
            }
            // console.log('replyInfo', replyInfo);
            return await this.reply(replyInfo);
        };
        /* 获取消息 */
        ntqq.getMsg = async function (replyInfo) {
            try {
                let uuid = randomUUID();
                let body = {
                    action: 'get_msg',
                    params: {
                        message_id: replyInfo.msg,
                    },
                    echo: uuid,
                };
                console.log('ntqq获取消息', body);
                ws.send(JSON.stringify(body));
                return new Promise((resolve, reject) => {
                    listArr.push({ uuid, eventS });
                    let timeoutID = setTimeout(() => {
                        delListens(uuid);
                        eventS.emit(uuid, '');
                    }, 3 * 1000);
                    eventS.once(uuid, res => {
                        try {
                            delListens(uuid);
                            clearTimeout(timeoutID);
                            resolve(res || '');
                        } catch (e) {
                            console.error(e);
                        }
                    });
                });
            } catch (e) {
                console.error('ntqq:获取消息失败', e);
            }
        };
        /* 注入删除消息方法 */
        ntqq.delMsg = async function (argsArr) {
            try {
                argsArr.forEach(e => {
                    if (typeof e !== 'string' && typeof e !== 'number') return false;
                    ws.send(
                        JSON.stringify({
                            action: 'delete_msg',
                            params: { message_id: e },
                        })
                    );
                });
                return true;
            } catch (e) {
                console.log('ntqq撤回消息异常', e);
                return false;
            }
        };
        // /* 注入删除消息方法 其实为踢人*/
        // ntqq.delMsg = async function (replyInfo) {
        //     console.log('delmsgreplyInfo', replyInfo);
        //     try {
        //         let group_id = replyInfo.groupId;
        //         let user_id = replyInfo.userId;
        //         ws.send(
        //             JSON.stringify({
        //                 action: 'set_group_kick',
        //                 params: {
        //                     group_id: parseInt(group_id),
        //                     user_id: parseInt(user_id),
        //                     reject_add_request: false,
        //                 },
        //             })
        //         );

        //         return true;
        //     } catch (e) {
        //         console.log('踢人异常', e);
        //         return false;
        //     }
        // };

    })
    /**向/api/系统路由中添加路由 */
    router.get('api/bot/ntqqws', (req, res) =>
        res.send({ msg: '这是Bncr 外置ntqq Api接口，你的get请求测试正常~，请用ws交互数据' })
    );
    router.post('/api/bot/ntqqws', async (req, res) =>
        res.send({ msg: '这是Bncr 外置ntqq Api接口，你的post请求测试正常~，请用ws交互数据' })
    );

    function delListens(id) {
        listArr.forEach((e, i) => e.uuid === id && listArr.splice(i, 1));
    }
}