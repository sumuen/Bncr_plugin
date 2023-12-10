/**
 * @author muzi
 * @name BigFoot Script
 * @description Big foot game for a group
 * @rule ^(今天看了h图)$
 * @rule ^(今天看了h片)$
 * @rule ^(今天打了脚)$
 * @rule ^(帮打)$
 * @rule ^(大脚排名)$
 * @rule ^(大脚指南)$
 * @rule ^(胶)([0-9]+) ([\s\S]+)$
 * @rule ^(大脚市场)$
 * @rule ^(脚易)$
 * @rule ^(py|PY)$
 * @rule ^(打卡)$
 * @rule ^(打卡排名)$
 * @rule ^(战报) ([0-9]{1,2})?[-.。，]?([0-9]{1,2})?$
 * @rule ^(战报)$
 * @rule ^(禅) ([\s\S]+)$
 * @admin false
 * @public true
 * @origin origin什么意思
 * @version 1.2.0
 * @priority 200
 * @disable false
 */

const axios = require('axios');
const got = require('got');


//const chatgpt = require('chatgpt');
const { be } = require("date-fns/locale");
const e = require("express");
const chatGPTStorage = new BncrDB('ChatGPT');
const fetch = require('node-fetch');

// 创建数据库实例
const footDb = new BncrDB('Foot');
const footMarketDb = new BncrDB('FootMarket');
const footcheckDb = new BncrDB('FootCheck');
const foothistory = new BncrDB('foothistory')
// 创建挂单数据库
const orderDb = new BncrDB('orders');
//获取当前时间 
const now = new Date();
//获取当前小时分钟
const hour = now.getHours();
const minute = now.getMinutes();



const nowdate = now.getMonth() + 1 + '-' + now.getDate();
const time = now.getHours().toString().padStart(2, '0') + "-"
    + now.getMinutes().toString().padStart(2, '0') + "-"
    + now.getSeconds().toString().padStart(2, '0');
const today = new Date().toDateString();
//py系统
function getPySegment(pyValue) {
    if (pyValue < 0) return { segment: '老骚b', bonus: -0.1 };
    if (pyValue >= 0 && pyValue <= 20) return { segment: 'homo', bonus: 0 };
    if (pyValue >= 21 && pyValue <= 30) return { segment: '杰哥', bonus: 0.1 };
    if (pyValue >= 31 && pyValue <= 40) return { segment: 'dark♂', bonus: 0.2 };
    if (pyValue >= 41 && pyValue <= 50) return { segment: 'king', bonus: 0.3 };
    if (pyValue > 50) return { segment: '114514', bonus: 0.4 };
}
module.exports = async (s) => {
    let footUsers = await footDb.get('FootUsers') || [];
    const userId = await s.getUserId();
    const userName = await s.getUserName();
    //为用户初始化大脚值
    let user = footUsers.find(u => u.id === userId);
    if (!user) {
        user = { id: userId, name: userName, footValue: 0, footCount: 0, lastRun: null, py: 10 };
        footUsers.push(user);
        await footDb.set('FootUsers', footUsers); // 仅在新用户加入时更新数据库
    }
    //为用户初始化py值
    let pyInfo = getUserPyAndSegment(user);

    let pyUsers = await footDb.get('pyUsers') || [];

    let pyUser = pyUsers.find(u => u.id === userId);
    if (!pyUser) {
        pyUser = { id: userId, name: userName, py: 10 };
        pyUsers.push(pyUser);
        await footDb.set('pyUsers', pyUsers); // 仅在新用户加入时更新数据库
    }

    let param1 = await s.param(1);
    for (let user of footUsers) {
        if (!user.hasOwnProperty('hplastRun')) {
            user.hplastRun = null;
        }
        if (!user.hasOwnProperty('htlastRun')) {
            user.htlastRun = null;
        }
        if (!user.hasOwnProperty('djlastRun')) {
            user.djlastRun = null;
        }
    }
    await footDb.set('FootUsers', footUsers);
    //checkvalue
    async function checkValue(input, footValue) {
        if (footValue <= 0) {
            return { isValid: false, errorMessage: '你的大脚值已经为0，不能参与打脚操作了' };
        }
        const intValue = parseInt(input);
        if (!isFinite(intValue) || intValue <= 0 || Math.floor(intValue) != intValue) {
            return { isValid: false, errorMessage: '请输入一个正整数' };
        }
        return { isValid: true };
    }
    //checkpyvalue
    function checkPyValue(input, pyValue) {
        if (pyValue <= 0) {
            return { isValid: false, errorMessage: '你的皮燕已经变成群友的形状了，安心做你的肉便器吧！' };
        }
        const intValue = parseInt(input);
        if (!isFinite(intValue) || intValue <= 0 || Math.floor(intValue) != intValue) {
            return { isValid: false, errorMessage: '请输入一个正整数' };
        }

        return { isValid: true };
    }
    //获取排名
    async function generateRanking(footUsers) {
        footUsers.sort((a, b) => b.footValue - a.footValue);
        const titles = ['大脚英雄', '大脚先锋', '大脚卫士', '大脚先生'];

        footUsers.forEach((u, i) => {
            if (i < titles.length) {
                u.title = titles[i];
            } else {
                u.title = '大脚勇士 #' + (i + 1);
            }
        });

        let response = '大脚排名：\n';
        footUsers.forEach((u, i) => {
            response += (i + 1) + '. ' + u.name + ': ' + u.footValue + ' (' + u.title + ')\n';
        });
        return response;
    }
    //帮打
    async function helpFoot(s, user, footUsers) {
        const ranking = await generateRanking(footUsers);
        await s.reply(`今天要帮哪位群友打脚呢？\n${ranking}`);
        const inputA = await s.waitInput(() => { }, 60);
        const a = inputA.getMsg();
        console.log(inputA);
        // 判断inputA是数字还是用户名
        let targetUser;
        let pytargetUser;
        if (isFinite(a) && Math.floor(a) == a) {
            // inputA是一个数字，代表排名
            const rank = parseInt(a) - 1; // -1因为数组的索引是从0开始的
            if (rank < 0 || rank >= footUsers.length) {
                await s.reply(`没有找到排名为${a}的用户，请检查排名是否正确。`);
                return;
            } else if (footUsers[rank].id === user.id) {
                //如果选择对象是user自己
                await s.reply(`自己玩自己？你是不是有毛病？`);
                return;
            } else {
                targetUser = footUsers[rank];
                pytargetUser = footUsers[rank];
            }
        } else {
            // inputA是用户名
            targetUser = footUsers.find(u => u.name === a);
            pytargetUser = pyUsers.find(u => u.name === a);
        }

        if (!targetUser) {
            // 用户未找到
            await s.reply(`没有找到名字为${a}的用户，请检查名字是否正确。`);
            return;
        }
        //初始化用户的大脚币
        if (!user.coins) {
            user.coins = {};
        }
        // 用户被找到，进行下一步的操作...
        await s.reply(`你选中的是${targetUser.name}, 他的大脚值为${targetUser.footValue}，你要帮他打多少脚呢？还是，你要梭哈吗？`);
        const inputB = await s.waitInput(() => { }, 60);
        let b = inputB.getMsg();
        let betValue;
        if (b === '梭哈') {
            if (user.footValue <= 0) {
                s.reply('没大脚还玩，滚出去！');
                return
            } else {
                // 梭哈
                betValue = user.footValue;
            }
        } else {
            let checkResult = await checkValue(b, user.footValue);
            if (!checkResult.isValid) {
                await s.reply(checkResult.errorMessage);
                return;
            }
            betValue = parseInt(b);
        }
        if (user.footValue < betValue) {
            await s.reply('你的大脚值不足,滚出去！');
            return;
        }


        // 计算获胜的概率
        let otherUserFootValue = targetUser.footValue;
        // 查询用户和目标用户的py数据
        let userPyData = footUsers.find(u => u.id === userId);
        let targetUserPyData = footUsers.find(u => u.id === targetUser.id);

        if (!userPyData || !targetUserPyData) {
            // 如果找不到用户或目标用户的py数据，抛出错误或返回
            throw new Error('找不到用户或目标用户的py数据');
        }
        let userPySegment = getPySegment(userPyData.py);
        let targetPySegment = getPySegment(targetUserPyData.py);

        let winProbability = Math.random() * (1 + userPySegment.bonus);
        await s.reply('你的获胜概率是：' + winProbability * 100 + '%');

        let randomA = Math.random() + targetPySegment.bonus;
        if (randomA < winProbability) {
            if (targetUser.footValue >= betValue) {
                // user赢了，将otherUser的大脚值转移给user
                targetUser.footValue -= betValue;
                user.footValue += betValue;
                await s.reply('你获胜了，你赢得了' + betValue + '大脚值');
            }
            else {
                let otherUserOldFootValue = targetUser.footValue;
                user.footValue += betValue;
                targetUser.footValue = 0;
                await s.reply('你获胜了，你赢得了' + otherUserOldFootValue + '大脚值');
            }
        } else {
            // user输了，将betValue转移给targetUser
            user.footValue -= betValue;
            targetUser.footValue += betValue;
            await s.reply('你输了，你失去了' + betValue + '大脚值');
        }

        // 在结束之后，更新数据库
        await footDb.set('FootUsers', footUsers);
        //记录交易记录
        let transactionData = {
            time: time,
            actor: user.name,
            target: targetUser.name,
            action: (randomA < winProbability) ? "win" : "loss",
            amount: betValue
        };

        await history(nowdate, transactionData);
        let transactions = await foothistory.get(nowdate);
        let recentTransactions = transactions.slice(-3);
        let recentransactionTexts = recentTransactions.map(t => {
            return `${t.time} ${t.actor} 通过帮打${t.action === 'win' ? '赢得' : '输掉'}了 ${t.target} ${t.amount}大脚值`;
        })
        let result = recentransactionTexts.join('\n');
        await s.reply('最近三次帮打\n' + result);
    }
    //大脚战报
    async function footReport(date) {
        let transactions = await foothistory.get(date);

        if (!transactions) {
            // 如果没有交易记录，输出“该日无数据”
            await s.reply(date + '该日无数据');
            return;  // 立即结束函数
        }

        let transactionTexts = transactions.map(t => {
            return `${t.time} ${t.actor} 通过帮打${t.action === 'win' ? '赢得' : '输掉'}了 ${t.target} ${t.amount}大脚值`;
        });

        let result = transactionTexts.join('\n');
        await s.reply(date + '大脚战报\n' + result);
    }


    //记录交易
    async function history(date, transaction) {
        let transactions = await foothistory.get(date) || [];
        transactions.push(transaction);
        await foothistory.set(date, transactions);
        console.log('交易已记录');
    }
    //py
    //初始化py
    // // 为用户初始化py值
    // async function initializeUser(userId, userName) {
    //     let pyUsers = await footDb.get('pyUsers') || [];

    //     let pyUser = pyUsers.find(u => u.id === userId);
    //     if (!pyUser) {
    //         pyUser = { id: userId, name: userName, pyValue: 10 };
    //         pyUsers.push(pyUser);
    //         await footDb.set('pyUsers', pyUsers); // 仅在新用户加入时更新数据库
    //     }

    //     return pyUser;  // 返回初始化的用户对象
    // }

    //创建挂单
    async function createOrder(user, action, price) {
        let orders = await orderDb.get('orders') || [];
        let newOrder = {
            id: Date.now(),  // Unique id for each order
            userId: user.id,
            targetuserId: null,
            action: action,
            price: price,
            status: 0,  // 0 for "pendingtran"
            time: new Date().getTime()
        };
        orders.push(newOrder);
        await orderDb.set('orders', orders);
    }

    //交易挂单
    async function pytran(order, user, action, price) {
        let orders = await orderDb.get('orders') || [];
        for (let existingOrder of orders) {
            if ((existingOrder.userId === user.id || existingOrder.targetuserId === user.id) && existingOrder.status === 1) {
                await s.reply('我看你正忙着啊🐶');
                let busy = true;
                return;
            }
        }

        for (let i = 0; i < orders.length; i++) {
            if (orders[i].id === order.id) {
                if (action === 'buy') {
                    // 检查用户的大脚值是否足够
                    if (user.footValue < price) {
                        await s.reply('你的大脚值不足');
                        return;
                    }
                    // 买方大脚值减少
                    user.footValue -= price;
                    // 卖方大脚值增加
                    let seller = footUsers.find(u => u.id === order.userId);
                    seller.footValue += price;
                    await s.reply('您成功购买了'+seller.name+'的皮燕，花费了' + price + '大脚值,尽情享用吧！')
                } else if (action === 'sell') {
                    // 检查卖方的大脚值是否足够
                    if (user.footValue < price) {
                        await s.reply('你的大脚值不足');
                        return;
                    }
                    // 卖方大脚值减少
                    user.footValue -= price;
                    // 买方大脚值增加
                    let buyer = footUsers.find(u => u.id === order.userId);
                    buyer.footValue += price;
                    await s.reply('您成功献祭了你的皮燕给'+buyer.name+'，获得了' + price + '大脚值');
                }
                // 更新订单状态
                orders[i].status = 1;  // 1 for "intran"
                orders[i].targetuserId = user.id;
                orders[i].time = new Date().getTime();
                break;
            }
        }
        // 更新数据库
        await orderDb.set('orders', orders);
        await footDb.set('FootUsers', footUsers);
    }
    // 取消挂单
    async function cancelOrder(s, user) {
        let orders = await orderDb.get('orders') || [];
        let userOrders = orders.filter(order => order.userId === user.id && order.status === 0);

        if (userOrders.length === 0) {
            await s.reply('你没有任何挂单');
            return;
        }

        let orderList = '以下是你的所有挂单，请输入你想要取消的挂单的编号：\n';
        for (let i = 0; i < userOrders.length; i++) {
            let order = userOrders[i];
            orderList += `${i + 1}. 类型：${order.action}, 价格：${order.price}\n`;
        }
        await s.reply(orderList);

        // 然后继续处理用户的输入
        const inputA = await s.waitInput(() => { }, 60);
        const orderIndex = parseInt(inputA.getMsg()) - 1;
        if (orderIndex < 0 || orderIndex >= userOrders.length) {
            await s.reply(`无效的编号：${orderIndex + 1}`);
            return;
        }

        // 取消选中的订单，即从orders中删除该订单
        let order = userOrders[orderIndex];
        orders = orders.filter(o => o !== order);

        // 更新数据库
        await orderDb.set('orders', orders);
        await s.reply(`订单已取消：类型：${order.action}, 价格：${order.price}`);
    }


    //挂单市场
    async function pymarket() {
        let orders = await orderDb.get('orders') || [];
        let pendingOrders = orders.filter(order => order.status === 0);
        console.log(pendingOrders);
        return pendingOrders;
    }
    //展示挂单
    async function showPymarket(s) {
        let pendingOrders = await pymarket();
        let pendingOrdersText = pendingOrders.map((order, index) => {
            let userName = findUserNameById(order.userId);
            let type = order.action === 'buy' ? '收皮燕子' : '谁来撅我♂';
            return `编号: ${index + 1}, 用户: ${userName}, 类型: ${type}, 价格: ${order.price}`;
        }).join('\n');
        s.reply(pendingOrdersText);
    }

    //所有挂单
    async function showAllPymarket(s) {
        let orders = await orderDb.get('orders') || [];
        let ordersText = orders.map((order, index) => {
            let userName = findUserNameById(order.userId);
            let targetuserName = findUserNameById(order.targetuserId);
            let type = order.action === 'buy' ? '收皮燕子' : '谁来撅我♂';
            let status = order.status === 1 ? 'fu♂k' : order.status === 2 ? '自己擦擦吧' : '挂单中';
            return ` ${index + 1}, 用户: ${userName}, 类型: ${type}, 价格: ${order.price}, 状态: ${status}, 目标用户: ${targetuserName}`;
        }).join('\n');
        s.reply(ordersText);
    }
    //清空挂单
    async function clearAllOrders() {
        await orderDb.set('orders', []);
    }

    //idfindname
    function findUserNameById(userId) {
        for (let user of footUsers) {
            if (user.id === userId) {
                return user.name;
            }
        }
        // 如果没有找到用户，返回一个默认值
        return "来玩啊~";
    }
    //定时检测交易挂单
    async function pytran2() {
        let orders = await orderDb.get('orders') || [];
        let now = new Date().getTime();
        for (let order of orders) {
            if (order.status === 1 && now - order.time >= 2 * 60 * 60 * 1000) {
                order.status = 2;  // 2 for "completed"
                // 找到用户和目标用户
                let user = footUsers.find(u => u.id === order.userId);
                let targetuser = footUsers.find(u => u.id === order.targetuserId);



                // 完成交易
                let targetuserPyChange = Math.max(0.2, targetuser.py * 0.2);
                targetuser.py -= targetuserPyChange;
                user.py += 2 + targetuserPyChange;

                // 更新数据库
                await orderDb.set('orders', orders);
                await footDb.set('FootUsers', footUsers);
                //await footDb.set('pyUsers', pyUsers);
            }
        }
    }
    //获取py值信息
    function getUserPyAndSegment(user) {
        let pyValue = user.py;
        let pySegment = getPySegment(pyValue);
        return {
            pyValue: pyValue,
            segment: pySegment.segment,
            bonus: pySegment.bonus
        };
    }


    //py主函数
    async function piyan(s, user, footUsers) {
        await s.reply('请选择你的操作：\n1. 创建订单\n2. 交易订单\n3. 显示订单\n4. 检查订单\n5. 我的信息\n6. 取消订单');
        const input = await s.waitInput(() => { }, 60);
        const selectedOption = parseInt(input.getMsg());

        switch (selectedOption) {
            case 1: {
                // 创建订单
                await s.reply('请输入操作类型（buy/sell）：');
                const inputA = await s.waitInput(() => { }, 60);
                if (inputA.getMsg() == "q" || inputA.getMsg() == "Q") {
                    await s.reply("已退出");
                    return;
                }
                const action = inputA.getMsg();

                await s.reply('请输入价格：');
                const inputB = await s.waitInput(() => { }, 60);
                if (inputB.getMsg() == "q" || inputB.getMsg() == "Q") {
                    await s.reply("已退出");
                    return;
                }

                const price = parseInt(inputB.getMsg());
                let pyValue = user.py;

                let checkResult = checkPyValue(price, pyValue);
                if (!checkResult.isValid) {
                    await s.reply(checkResult.errorMessage);
                    return;
                }
                await createOrder(user, action, price);
                if (action == "buy") {
                    await s.reply(`号外号外！${user.name}想要收你的皮燕子，价格是${price}皮燕，快来交易吧！`);
                } else {
                    await s.reply(`号外号外！${user.name}想要被撅，价格是${price}皮燕，快来交易吧！`);
                }
                break;
            }
            case 2: {
                // showPymarket
                await showPymarket(s);
                const inputA = await s.waitInput(() => { }, 60);
                if (inputA.getMsg() == "q" || inputA.getMsg() == "Q") {
                    await s.reply("已退出");
                    return;
                }

                let order = inputA.getMsg();
                if (isFinite(order) && Math.floor(order) == order) {
                    // inputA是一个数字，代表排名
                    const rank = parseInt(order) - 1; // -1因为数组的索引是从0开始的
                    let pendingOrders = await pymarket();
                    if (rank < 0 || rank >= pendingOrders.length) {
                        await s.reply(`没有找到排名为${order}的挂单`);
                        return;
                    } else {
                        //通过rank找到对应的订单进行交易
                        let selectedOrder = pendingOrders[rank];
                        if (selectedOrder.action === 'buy' && selectedOrder.userId !== user.id) {
                            await pytran(selectedOrder, user, 'sell', selectedOrder.price);
                            if (busy = !true) { await s.reply('成功售出订单'); }
                        } else if (selectedOrder.action === 'sell' && selectedOrder.userId !== user.id) {
                            await pytran(selectedOrder, user, 'buy', selectedOrder.price);
                            if (busy = !true) { await s.reply('成功购买订单'); }
                        } else {
                            await s.reply('不能交易自己的订单或无效的操作');
                        }
                    }
                } else {
                    s.reply('你输你妈呢？');
                }

                break;

            }
            case 3:
                // 显示订单
                await showAllPymarket(s);
                break;
            case 4:
                // 检查订单
                await pytran2(s);
                break;
            case 5: {
                // 关于我
                let pyInfo = getUserPyAndSegment(user);
                let replyText = `你的皮燕值为：${pyInfo.pyValue}\n你的段位为：${pyInfo.segment}\n你的帮打加持为：${pyInfo.bonus}`;
                await s.reply(replyText);
                break;
            }
            case 6: {
                // 取消订单
                await cancelOrder(s, user);
                break;
            }
            case 7:
                //清空挂单
                if (!await s.isAdmin()) {
                    s.reply('滚');
                    return
                }
                await clearAllOrders();
                s.reply('已清空挂单');
                break;
            default:
                await s.reply('无效的选项，请输入正确的数字。');
                break;
        }
    }
    //generateGptReply

    async function generateGptReply(s, input) {
        const { ChatGPTUnofficialProxyAPI } = await import('chatgpt');
        const accessToken = await chatGPTStorage.get('Token');

        const api = new ChatGPTUnofficialProxyAPI({
            accessToken,
            apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation'
        });

        let opt = {
            timeoutMs: 2 * 60 * 1000,
        };

        console.log('创建新的会话...');
        let res = {},
            maxNum = 5,
            conversationId = null;
        do {
            try {
                res = await api.sendMessage(input, opt);
                if (res?.text) {
                    // Save the conversationId for further reference
                    conversationId = res.conversationId;
                    break;
                }
                await sysMethod.sleep(1);
            } catch (e) {
                opt = {
                    timeoutMs: 2 * 60 * 1000,
                };
                console.log('ChatGPT.js:', e);
                await sysMethod.sleep(1);
            }
        } while (maxNum-- > 1);
        const url = 'https://gpt.sumuen.ml/api/conversation/' + conversationId;
        fetch(url, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch((error) => {
                console.error('Error:', error);
            });
        return { text: res.text, conversationId: conversationId };
    }

    //查询加密货币
    async function getCryptoPrice(cryptoNames) {
        const prices = {};
        const endpoint = 'https://api.gateio.ws/api/v4/spot/tickers';

        try {
            const response = await axios.get(endpoint)
            const data = response.data;

            for (let item of data) {
                let cryptoName = item.currency_pair;
                if (cryptoNames.includes(cryptoName)) {
                    const last = parseFloat(item.last);
                    const sodUtc8 = parseFloat(item.highest_bid);  // 使用 highest_bid 作为开盘价，因为 gateio API 未提供开盘价
                    prices[cryptoName] = {
                        last: last,
                        sodUtc8: sodUtc8
                    };
                }
            }
        } catch (error) {
            console.error(error);
            for (let cryptoName of cryptoNames) {
                prices[cryptoName] = null;
            }
        }

        return prices;
    }


    // // 用户购买加密货币
    // async function buyCoin(s) {
    //     const userName = await s.getUserName();
    //     const user = footValueUsers.find(u => u.name === userName);

    //     const coin = s.param(1); //用户选择购买的货币类型
    //     const amount = Number(s.param(2)); //用户选择购买的数量
    //     const leverage = Number(s.param(3)) || 1; //用户选择的杠杆倍数，如果没有选择，则默认为1

    //     const price = await getCryptoPrice(coin);

    //     if (price === null) {
    //         await s.reply('无法获取加密货币价格');
    //         return;
    //     }

    //     if (user.footValue >= price * amount * leverage) {
    //         user.footValue -= price * amount * leverage;
    //         user.coins[coin] = (user.coins[coin] || 0) + amount * leverage;
    //         await s.reply(`你用${leverage}倍杠杆购买了${amount * leverage}个${coin}，花费了${price * amount * leverage}大脚值`);
    //     } else {
    //         await s.reply('你的大脚值不足');
    //     }
    // }
    // 用户购买加密货币
    async function buyCoin(s, user, coin, amount, leverage) {
        const price = await getCryptoPrice(coin);

        if (price === null) {
            await s.reply('无法获取加密货币价格');
            return;
        }

        if (user.footValue >= price * amount * leverage) {
            user.footValue -= price * amount * leverage;
            user.coins[coin] = (user.coins[coin] || 0) + amount * leverage;
            await s.reply(`你用${leverage}倍杠杆购买了${amount * leverage}个${coin}，花费了${price * amount * leverage}大脚值`);

            // 将交易记录在footMarketDb
            let transaction = {
                userID: user.userID,
                action: "购买",
                coin: coin,
                amount: amount * leverage,
                price: price,
                leverage: leverage
            };
            await footMarketDb.set('Transactions', transaction);
        } else {
            await s.reply('你的大脚值不足');
        }
    }

    // 用户出售加密货币
    async function sellCoin(s, user, coin, amount) {
        const price = await getCryptoPrice(coin);

        if (price === null) {
            await s.reply('无法获取加密货币价格');
            return;
        }

        if (user.coins[coin] >= amount) {
            user.footValue += price * amount;
            user.coins[coin] -= amount;
            await s.reply(`你卖出了${amount}个${coin}，得到了${price * amount}大脚值`);

            // 将交易记录在footMarketDb
            let transaction = {
                userID: user.userID,
                action: "卖出",
                coin: coin,
                amount: amount,
                price: price,
            };
            await footMarketDb.set('Transactions', transaction);
        } else {
            await s.reply('你的加密货币数量不足');
        }
    }
    // 查看钱包命令
    async function showWallet(s, user) {
        let transactions = await footMarketDb.get('Transactions');
        let userTransactions = transactions.filter(transaction => transaction.userID === user.userID);

        // 列出所有交易记录
        for (let transaction of userTransactions) {
            await s.reply(`操作：${transaction.action}，币种：${transaction.coin}，数量：${transaction.amount}，价格：${transaction.price}${transaction.leverage ? '，杠杆：' + transaction.leverage : ''}`);
        }
    }
    if (param1 === '今天看了h图' || param1 === '今天看了h片' || param1 === '今天打了脚') {
        let checkUsers = await footcheckDb.get('FootUsers') || [];
        let checkUser = checkUsers.find(u => u.id === userId);
        console.log(nowdate)
        if (checkUser.checkdate === nowdate) {
            // 用户已经打卡，不允许进行操作
            await s.reply('打卡怎可亵渎！');
            return;
        } else if (param1 === '今天看了h图') {
            //添加时间限制，每天运行前三次执行user.footValue += 1;，超过不执行
            if (!user.hasOwnProperty('htcount') || !user.hasOwnProperty('htlastRunDay') || user.htlastRunDay !== today) {
                // 如果htcount不存在，或者hlastRunDay不存在，或者最后一次的活动不是今天，那么重置htcount
                user.htcount = 1;
                user.htlastRunDay = today;
                user.footValue += 1;

                s.reply(hour + '点' + minute + '分' + userName + '就起来看h图了，真是个色狼');
            } else if (user.htcount < 3) {
                // 如果htcount小于3，那么增加htount和footValue
                user.htcount += 1;
                user.footValue += 1;
                s.reply(userName + '又看h图，大脚值+1，现在总大脚值为' + user.footValue);
            } else {
                const gptreply = await generateGptReply(s, '请用少于30个字解释男性看色情图片的危害，并在言语中添加一些emoji表情，如：😂😂😂');
                s.reply(userName + '你一天看几次啊，' + gptreply.text);
                return; // 如果是，那就不再运行脚本
            }
        } else if (param1 === '今天看了h片') {
            //添加时间限制，每天运行前两次执行user.footValue += 2;，超过不执行
            if (!user.hasOwnProperty('hpcount') || !user.hasOwnProperty('hplastRunDay') || user.hplastRunDay !== today) {
                // 如果hpcount不存在，或者hplastRunDay不存在，或者最后一次的活动不是今天，那么重置hpcount
                user.hpcount = 1;
                user.hplastRunDay = today;
                user.footValue += 2;
                //获取当前时间
                let now = new Date();
                //获取当前小时分钟
                let hour = now.getHours();
                let minute = now.getMinutes();
                s.reply(hour + '点' + minute + '分' + userName + '就起来看h篇了，真是个色狼');
            } else if (user.hpcount < 2) {
                // 如果hpcount小于2，那么增加hpount和footValue
                user.hpcount += 1;
                user.footValue += 2;
                s.reply(userName + '又看h篇，大脚值+2，现在总大脚值为' + user.footValue);
            }
            else {
                const gptreply = await generateGptReply(s, '请用少于30个字解释男性看色情影片的危害，并在言语中添加一些emoji表情，如：😂😂😂');
                s.reply(userName + '你一天看几次啊，' + gptreply.text);
                return; // 如果是，那就不再运行脚本
            }

        } else if (param1 === '今天打了脚') {
            //添加时间限制，每天只能运行一次
            if (user.djlastRun === today) {
                const gptreply = await generateGptReply(s, '请用少于30个字解释男性频繁自慰的危害，并在言语中添加一些emoji表情，如：😂😂😂');
                s.reply(userName + '你一天看几次啊' + gptreply.text);
                console.log(gptreply.conversationId);
                return; // 如果是，那就不再运行脚本
            } else {
                user.footValue += 3;
                user.djlastRun = today;
                await s.reply(userName + '，你的大脚值+3，现在总大脚值为' + user.footValue);
            }
        }
    }
    else if (param1 === '打卡') {
        //获取用户名
        let footUsers = await footcheckDb.get('FootUsers') || [];
        let user = footUsers.find(u => u.id === userId);
        if (!user) {
            user = { id: userId, name: userName, checktimes: 0, checkdate: "0-0" };
            footUsers.push(user);
            await footcheckDb.set('footUsers', footUsers); // 仅在新用户加入时更新数据库   
        }
        //获取当前时间
        let now = new Date();
        //获取当前时间的月日
        if (user.checktimes === undefined) {
            user.checktimes = 0;
        }
        //今日未打卡，记录打卡时间，打卡时间+1
        if (user.checkdate != nowdate) {
            user.checkdate = nowdate;
            user.checktimes += 1;
            await s.reply(userName + '打卡成功，累计打卡次数为' + user.checktimes);
            //如果今日已经打卡则不可进行看了h图、看了h片、打了脚的操作

        } else {
            //今日已打卡，提示已打卡
            await s.reply('你已经打卡了哟，去找点别的事情做吧！累计打卡次数为' + user.checktimes);
        }
        //将打卡信息存入数据库
        await footcheckDb.set('FootUsers', footUsers);
    } else if (param1 === '打卡排名') {
        let footUsers = await footcheckDb.get('FootUsers') || [];
        if (footUsers.length === 0) {
            await s.reply('还没有人打卡呢！');
        } else {
            footUsers.sort((a, b) => b.checktimes - a.checktimes);  //降序排列，打卡次数多的在前

            let rankText = '打卡排名如下：\n';
            for (let i = 0; i < footUsers.length; i++) {
                rankText += (i + 1) + '. ' + footUsers[i].name + ': ' + footUsers[i].checktimes + '次\n';
            }

            await s.reply(rankText);
        }
    }
    else if (param1 === '大脚市场') {
        let cryptoNames = ['BTC_USDT', 'DOGE_USDT', 'PEPE_USDT', 'ETH_USDT'];
        let prices = await getCryptoPrice(cryptoNames);
        let messages = [];
        cryptoNames.forEach(cryptoName => {
            if (prices[cryptoName]) {
                messages.push(`${cryptoName}: 最后价格=${prices[cryptoName].last}脚, 开盘价=${prices[cryptoName].sodUtc8}`);
            } else {
                messages.push(`${cryptoName}: 无法获取价格`);
            }
        });

        s.reply(messages.join('\n'));
    }

    else if (param1 === '脚易') {
        // 提示用户输入命令
        await s.reply('请输入命令：\n 1. 购买货币：购买\n 2. 卖出货币：卖出\n 3. 查看我的钱包：我的钱包');
        const inputCommand = await s.waitInput(() => { }, 60);
        let command = inputCommand.getMsg();

        // 如果是购买命令
        if (command === '购买' || command === '1') {
            await s.reply('请输入购买的货币名');
            const inputCoinName = await s.waitInput(() => { }, 60);
            let coinName = inputCoinName.getMsg();

            await s.reply('请输入购买数量');
            const inputAmount = await s.waitInput(() => { }, 60);
            let amount = Number(inputAmount.getMsg());

            await s.reply('请输入杠杆倍数 (如果没有选择，默认为1)');
            const inputLeverage = await s.waitInput(() => { }, 60);
            let leverage = inputLeverage.getMsg() ? Number(inputLeverage.getMsg()) : 1;

            await buyCoin(s, user, coinName, amount, leverage);
        }
        // 如果是卖出命令
        else if (command === '卖出' || command === '2') {
            await s.reply('请输入卖出的货币名');
            const inputCoinName = await s.waitInput(() => { }, 60);
            let coinName = inputCoinName.getMsg();

            await s.reply('请输入卖出数量');
            const inputAmount = await s.waitInput(() => { }, 60);
            let amount = Number(inputAmount.getMsg());

            await sellCoin(s, user, coinName, amount);
        }
        // 如果是查看钱包命令
        else if (command === '我的钱包' || command === '3') {
            await showWallet(s, user);
        }
        else {
            await s.reply('命令错误');
        }

        // 记得在结束之后，更新数据库
        await footDb.set('FootUsers', footUsers);

        //通过用户大脚值等值usdt来购买加密货币，用户可以选择杠杆倍数，如果没有选择，则默认为1，然后将购买的加密货币存入用户的钱包中，买入的加密货币可以卖出变回大脚值，卖出的加密货币会从用户的钱包中扣除，一定数量的大脚值可以在大脚商店中购买商品
    }


    else if (param1 === '帮打') {
        await helpFoot(s, user, footUsers);
        await footDb.set('FootUsers', footUsers);
    } else if (param1 === '大脚市场') {
        await footmarket(s, user, footUsers);
    }
    else if (param1 === '大脚排名') {
        const ranking = await generateRanking(footUsers);
        await s.reply(ranking);
    } else if (param1 === '大脚指南') {
        s.reply(' 今天看了h图 \n 今天看了h片 \n 今天打了脚 \n 帮打    \n 大脚排名 \n 大脚指南 \n');
    } else if (param1 === '胶') {
        if (!await s.isAdmin()) {
            return
        }
        let user = s.param(3);
        let value = parseInt(await s.param(2));
        let targetUser = footUsers.find(u => u.name === user);
        if (!targetUser) {
            await s.reply('此用户不存在');
            return;
        }
        targetUser.footValue += value;
        await s.reply('成功为' + user + '充值' + value + '大脚值');
        await footDb.set('FootUsers', footUsers);
    }
    else if (param1 === '战报') {
        let mouth = s.param(2);
        let day = s.param(3);
        let date = mouth + '-' + day;
        if (!date) {
            date = nowdate
        }
        footReport(date);

    }
    else if (param1 === 'py' || param1 === 'PY') {
        await piyan(s, user, footUsers);
    }
    else if (param1 === '禅') {
        if (!await s.isAdmin()) {
            return;
        }
        let user = s.param(2);
        if (user === 'all') {
            for (let u of footUsers) {
                u.footValue = 0;
            }
            await s.reply('所有用户已圆寂');
        } else {
            let targetUser = footUsers.find(u => u.name === user);
            if (!targetUser) {
                await s.reply('此用户不存在');
                return;
            }
            targetUser.footValue = 0;
            await s.reply(user + '已圆寂');
        }
        await footDb.set('FootUsers', footUsers);
    }



}