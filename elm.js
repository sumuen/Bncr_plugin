/**
 * @author muzi
 * @name elmck
 * @description elmck
 * @rule ^elm$
 * @rule ^(elm)([0-9]+)$
 * @rule ^elmgl$
 * @rule ^elmrz$
 * @rule ^elmqq$
 * @rule ^qlsync$
 * @rule ^qlconfig$
 * @rule ^elmck$
 * @rule ^elmcron$
 * @rule ^(?=.*cookie2=[^;]+;)(?=.*SID=[^;]+;)(?!.*cookie2=[^;]+;.*cookie2=[^;]+;)(?!.*SID=[^;]+;.*SID=[^;]+;)
 * @version 1.0.9
 * @priority 100001
 * @admin false
 * @origin muzi
 * @disable false
 * @cron 0 5 6,9,12,15,18,21 * * *
 */
const got = require('got');
const qldb = new BncrDB("elm");
const usrDb = new BncrDB('elmDB');
const AmTool = require("../红灯区/mod/AmTool");
const { ca } = require('date-fns/locale');
const ql = require('../红灯区/mod/ql');


module.exports = async (s) => {
    let globalEnv = [];
    const now = new Date();
    const userId = s.getUserId();
    let platform = s.getFrom();
    const key = platform + ':' + userId;
    const userInfo = await usrDb.get(key);
    let param2 = await s.param(2);
    let config
    //检查是否有青龙配置
    if (!qldb.get("ql")) {
        await qlinitialization();
        return;
    }
    if (platform == "cron") {
        await executeCronTask();
        return
    }

    const input = s.getMsg();
    switch (input) {
        case "elm":
            elmFunction();
            break;
        case "elmgl":
            accountmanager();
            break;
        case "elmrz":
            elmrzFunction();
            break;
        case "elmqq":
            elmqqFunction();
            break;
        case "qlconfig":
            qlconfigFunction();
            break;
        case "qlsync":
            qlsyncFunction();
            break;
        case "elmcron":
            executeCronTask();
            break;
        case "elmck":
            elmckFunction();
            break;
        default:
            searchspecificelm(param2);
            break;
    }
    class QLClient {

        constructor({ host, token }) {
            this.host = host;
            this.token = token;
        }
        //searchEnv
        async searchEnv(envName = "elmck") {
            let url = `http://${this.host}/open/envs?searchValue=${envName}`
            let body = ``
            let options = populateOptions(url, this.token, body);
            try {
                const response = await got.get(options);
                //console.log(response.body);
                let result = response.body;
                if (result.code == 200) {
                    let envs = result.data;
                    let env = envs.filter((env) => env.name === envName);
                    if (env.length > 0) { // 如果找到了匹配的环境变量
                        for (let i = 0; i < env.length; i++) {
                            await sleep(100);
                            console.log(`${env[i].value}`);
                            globalEnv.push(env[i]);
                        }
                        return env;
                    } else {
                        console.log(`未查询到环境变量：${envName}`);
                        return;
                    }
                } else {
                    console.log("查询环境变量失败")
                }
            } catch (error) {
                console.error(error);
            }
        }
        //addenv
        async addEnv(envName, envValue, remarks = "",) {
            let url = `http://${this.host}/open/envs`;
            let param = { value: envValue, name: envName, remarks };
            let body = JSON.stringify([param]);
            let options = populateOptions(url, this.token, body);
            try {
                const response = await got.post(options);
                let result = response.body;
                if (result.code == 200) {
                    console.log(`添加环境变量成功`);
                } else {
                    console.log(`添加环境变量失败`);
                }
            } catch (error) {
                console.error(error);
            }
        }
        //updateenv
        async updatEnv(envName, envValue) {
            let url = `http://${this.host}/open/envs`
            let body = `name=${envName}&value=${envValue}`
            let options = populateOptions(url, this.token, body);
            try {
                const response = await got.put(options);
                console.log(response.body);
                let result = response.body;
                if (result.code == 200) {
                    console.log(`更新环境变量成功`);
                    return result;
                } else {
                    console.log(`更新环境变量失败`);
                    return;
                }
            } catch (error) {
                console.error(error);
            }
        }
        //启用禁用env
        async enablEnv(envId) {
            let url = `http://${this.host}/open/envs/enable`
            let body = JSON.stringify([envId]);
            let options = populateOptions(url, this.token, body);
            try {
                console.log(`envId: ${envId}`);
                const response = await got.put(options);
                console.log(response.body);
                let result = response.body;
                if (result.code === 200) {
                    console.log(`启用环境变量成功`);
                } else {
                    console.log(`启用环境变量失败`);
                }
            } catch (error) {
                console.error(error);
            }
        }
        async disableEnv(envId) {
            let url = `http://${this.host}/open/envs/disable`;
            let body = JSON.stringify([envId]);  // 创建一个包含 id 的数组
            let options = populateOptions(url, this.token, body);
            try {
                console.log(`envId: ${envId}`);
                const response = await got.put(options);
                console.log(response.body);
                let result = response.body;
                if (result.code === 200) {
                    console.log(`禁用环境变量成功`);
                } else {
                    console.log(`禁用环境变量失败`);
                }
            } catch (error) {
                console.error(error);
            }
        }
        // qlsearchtask
        async qlsearchtask(taskName) {
            let url = `http://${this.host}/open/crons?searchValue=${taskName}`;
            let body = '';
            let options = populateOptions(url, this.token, body);
            try {
                const response = await got.get(options);
                let result = response.body;  // Need to parse the response body to a JavaScript object
                if (result.code == 200) {
                    let tasks = result.data.data; // The tasks are nested in data.data
                    let matchingTasks = tasks.filter((task) => task.command.includes(taskName));
                    if (matchingTasks.length > 0) { // If matching tasks are found
                        for (let i = 0; i < matchingTasks.length; i++) {
                            await sleep(100);
                            console.log(`${matchingTasks[i].id}`);
                        }
                        return matchingTasks[0].id; // return the id of the first matching task
                    } else {
                        console.log(`未查询到任务：${taskName}`);
                        return;
                    }
                } else {
                    console.log("查询任务失败");
                }
            } catch (error) {
                console.error(error);
                s.reply(`查询青龙任务失败: ${error.message}`);
            }
        }
        //qlruntask
        async qlruntask(taskid) {
            let url = `http://${this.host}/open/crons/run`
            let body = JSON.stringify([taskid]);
            let options = populateOptions(url, this.token, body);
            try {
                const response = await got.put(options);
                console.log(response.body);
                let result = response.body;
                if (result.code == 200) {
                    console.log(`运行任务成功`);
                } else {
                    console.log(`运行任务失败`);
                }
            } catch (error) {
                console.error(error);
                s.reply(`运行任务失败: ${error.message}`);
            }
        }
        //searchLatestLog
        async searchLatestLog(task, date) {
            console.log(`Searching for latest log for ${task} on ${date}`);
            let url = `http://${this.host}/open/logs`;
            let options = populateOptions(url, this.token);
            try {
                const response = await got(options);
                const data = response.body;
                // 查找匹配的主目录
                const matchedDir = data.dirs.find(d => d.name === task);
                if (!matchedDir) {
                    console.log(`没有找到关于 ${task} 的目录`);
                    return null;
                }
                if (!matchedDir.files) {
                    console.log(`目录 ${task} 中没有日志文件`);
                    return null;
                }
                const latestLog = matchedDir.files.filter(filename => {
                    return filename.includes(date);
                }).sort((a, b) => b.mtime - a.mtime)[0];
                console.log(`最新日志: ${latestLog}`);
                return `${latestLog}/${task}`;

            } catch (error) {
                console.error(`获取日志列表失败: ${error.message}`);
                return null;
            }
        }
        //getlogs
        async getlogs(key, username) {
            if (!key) {
                console.log("请提供有效的日志key");
                return null;
            }
            const [logFileName, parentDir] = key.split('/');
            // 根据父目录名和日志文件名生成日志的URL
            let url = `http://${this.host}/open/logs/${parentDir}/${logFileName}`;
            let logDateTime = key.slice(0, -4); // 去除时间戳后的.log
            let parts = logDateTime.split('-');
            let formattedStr = parts[1] + '.' + parts[2] + ' ' + parts[3] + ':' + parts[4];
            console.log(formattedStr); // 输出为: '07.27 14:08, 未去掉日期前的0'
            // 如果你希望日期前不要有0，可以使用parseInt进行转换：
            let formattedStrNoZero = parseInt(parts[1]) + '.' + parseInt(parts[2]) + ' ' + parts[3] + ':' + parts[4];
            console.log(`获取日志详情: ${url}`);
            const options = populateOptions(url, this.token);
            try {
                const response = await got(options);
                console.log(response.body);
                let result = response.body.data;
                return response.body;
            } catch (error) {
                console.error(`获取日志详情失败: ${error.message}`);
                return null;
            }
        }
    }
    async function qlinitialization() {
        if (!await s.isAdmin()) {
            s.reply("未配置青龙面板，请联系管理员配置");
            return;
        }
        s.reply("未配置青龙面板，是否配置？（y/n）");
        const inputA = await s.waitInput(() => { }, 60);
        if (inputA.getMsg() == "N" || inputA.getMsg() == "n") {
            await s.reply("已退出");
            return;
        }
        let urlBody = '';
        s.reply("请输入青龙面板地址：");
        const inputB = await s.waitInput(() => { }, 60);
        const urlinput = inputB.getMsg();
        const urlRegEx = /^https?:\/\/([a-zA-Z0-9-.]+(:[0-9]{1,5})?)(\/)?$/;
        if (urlRegEx.test(urlinput)) {
            // 提取URL主体部分
            let match = urlinput.match(urlRegEx);
            urlBody = match[1];
            s.reply(urlBody);
            console.log(urlBody);
        } else {
            s.reply("输入的地址不是有效的URL或者IP地址,exit。");
            return;
        }
        s.reply("请输入青龙面板ID：");
        const inputC = await s.waitInput(() => { }, 60);
        s.reply("请输入青龙面板密钥：");
        const inputD = await s.waitInput(() => { }, 60);
        await db.set("qlHost", urlBody);
        await db.set("ql_client_id", inputC.getMsg());
        await db.set("ql_client_secret", inputD.getMsg());
        //检查是否配置是否正确
        s.reply("青龙面板配置成功");
    }

    async function executeCronTask() {
        console.log("开始执行定时任务");
        //定时执行cookie检测
        config = await getqlconfig("ql");
        const client = new QLClient(config);
        let keys = await usrDb.keys();  // 获取所有的 key
        for (let key of keys) {
            let userInfo = await usrDb.get(key);  // 根据 key 获取对应的 value
            for (let account of userInfo.accounts) {
                let elmck = account.elmck;
                // 使用 elmck 进行 testCookie 检查,如果有效则查验qlenv中是否存在，如果不存在则添加，如果存在但status为1则调用enableenv启用，
                //如果失效则推送失效账号并调用disableenv禁用账号
                let testResult = await testCookie(elmck);
                if (testResult) {
                    let envs = await client.searchEnv('elmck');
                    let envInfo = envFindId(envs, elmck);
                    console.log(envInfo);
                    if (envInfo && envInfo.status === 1) {
                        console.log("启用环境变量");
                        await enableenv(envInfo.id);
                    } else if (!envInfo) {
                        console.log("添加环境变量");
                        await addenv('elmck', elmck, account.username);
                    }
                }
                if (!testResult) {
                    console.log(`账号 '${account.username}' 的 Cookie 已失效`);
                    // let envs = await searchenv("elmck")
                    // let envInfo = envFindId(envs, elmck);
                    // await disableEnv(envInfo.id)
                    // Split the key into platform and userId
                    let [keyPlatform, userId] = key.split(':');

                    const senders = [
                        {
                            id: userId,
                            type: 'userId',
                        },
                    ];
                    senders.forEach(e => {
                        let obj = {
                            platform: keyPlatform,  // Use the platform extracted from the key
                            msg: `${account.username}的cookie已失效，进入app，我的点几下`,
                            type: 'text',
                        };
                        obj[e.type] = e.id;
                        sysMethod.push(obj);
                        console.log(userId + keyPlatform);
                    });
                    continue;
                }
            }
        }
        console.log("结束执行定时任务");
    }
    //getuserinfo
    async function getUserInfo() {
        const key = platform + ':' + userId;
        return await usrDb.get(key);
    }
    //getqlconfig
    async function getqlconfig(qlKey) {
        const qlConfig = await qldb.get(qlKey);
        const token = await qldb.get(`${qlKey}.token`);
        return {
            host: qlConfig.host,
            id: qlConfig.client_id,
            secret: qlConfig.client_secret,
            token
        };
    }
    //elmfunction
    async function elmFunction() {
        if (!s.isAdmin()) {
            return;
        }
        //从elmDB中获取cookie
        let elminfo = await usrDb.get(platform + ':' + userId);
        if (!elminfo) {
            s.reply("未绑定elm账号，请直接发送elmck");
            return;
        }
        let globalEnv = elminfo.elmck;
        //await getToken(s);
        //查找账户
        let userInfo = await getUserInfo();

        if (userInfo) {
            // 遍历每一个账户，并获取其 elmck
            for (let account of userInfo.accounts) {
                const elmck = account.elmck;
                const username = account.username;
                // 使用得到的 elmck 调用 fetchUserDetail 函数
                await fetchUserDetail(elmck, username);
            }
        } else {
            s.reply("elm未绑定");
        }
    }
    //elmqq
    async function elmqqFunction() {
        //await getToken(s);
        //查找账户
        let userInfo = await getUserInfo();

        if (userInfo) {
            let accountList = [];
            config = await getqlconfig("ql2");
            const client = new QLClient(config);
            let envs = await client.searchEnv('elmqqck');
            // 遍历每一个账户，并获取其 elmck
            for (let index = 0; index < userInfo.accounts.length; index++) {
                const account = userInfo.accounts[index];
                const elmck = account.elmck;
                const username = account.username;
                //使用之前获取的envs
                let logMessage = `编号：${index}，账户：${username}, 状态：`;
                if (envs) {
                    let matchedEnv = envs.find((env) => env.value === elmck);
                    if (matchedEnv) {
                        logMessage += matchedEnv.status === 0 ? "已抢券" : "禁用";
                    } else {
                        logMessage += "未启用";
                    }
                } else {
                    logMessage += "未启用";
                }
                accountList.push(logMessage);
            }
            s.reply("账户列表：\n" + accountList.join('\n') + '\n' + "请输入编号进行抢券设置，q退出");

            //等待用户输入编号选择账号进行操作
            let input = await s.waitInput(() => { }, 60);
            let accountIndex = parseInt(input.getMsg(), 10);
            if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= userInfo.accounts.length) {
                s.reply("输入的编号无效");
                return;
            }
            let selectedAccount = userInfo.accounts[accountIndex];
            let selectedElmck = selectedAccount.elmck;
            //查找环境变量中是否有对应的ck
            let matchedEnv = envs ? envs.find((env) => env.value === selectedElmck) : null;
            if (matchedEnv) {
                // 如果ck存在且状态为禁用，则启用之
                if (matchedEnv.status === 1) {
                    await client.enablEnv(matchedEnv._id);
                    s.reply(`账号${selectedAccount.username}已设置为抢券状态`);
                }
                //如果启用则禁用之
                else {
                    await client.disableEnv(matchedEnv._id);
                    s.reply(`账号${selectedAccount.username}已取消抢券`)
                }
            } else {
                // 如果ck不存在，则添加之
                await client.addEnv('elmqqck', selectedElmck, selectedAccount.username);
                s.reply(`账号${selectedAccount.username}已设置为抢券状态`);
            }

        } else {
            s.reply("elm未绑定");
        }
    }
    //searchspecificelm 
    async function searchspecificelm(param2) {
        let elmck = str(s);
        // 检查 elmck 是否有效（即不为 undefined）
        if (elmck) {
            let username = await testCookie(elmck);
            if (username) {
                // 从 usrDb 中获取用户信息
                let userInfo = await getUserInfo();
                // 如果数据库中没有对应用户信息，则初始化
                if (!userInfo) {
                    userInfo = {
                        accounts: [],
                    };
                }
                // 查找账户
                const existingAccount = userInfo.accounts.find(account => account.elmck === elmck);
                // 添加到青龙中，先检查是否存在，存在则不添加
                //await getToken(s);
                config = await getqlconfig("ql");
                const client = new QLClient(config);
                let envs = await client.searchEnv('elmck');
                let existsInQingLong = envs.some(env => env.value == elmck);
                if (existingAccount && existsInQingLong) {
                    // 如果在数据库和青龙环境变量中都存在
                    s.reply(username + "的 cookie 已存在");
                } else {
                    // 如果账户在数据库中不存在
                    if (!existingAccount) {
                        // 将新的 elmck 添加到用户信息中
                        userInfo.accounts.push({ elmck, username });
                        await usrDb.set(platform + ':' + userId, userInfo);
                    }
                    // 如果账户在青龙环境变量中不存在
                    if (!existsInQingLong) {
                        // 将新的 elmck 添加到青龙中
                        await client.addEnv('elmck', elmck, username);
                    }
                    // 只有在添加操作执行之后才发送添加成功的消息
                    s.reply(username + '添加成功');
                }
            } else {
                s.reply("提供的 cookie 无效");
            }
        }
    }

    //elmck
    async function elmckFunction() {
        let userInfo = await getUserInfo();
        if (!userInfo) {
            s.reply("elm未绑定");
            return;
        } else {
            let accountList = userInfo.accounts.map((account, index) => `编号：${index}，账户：${account.username}`).join('\n');
            s.reply("elm列表\n" + accountList + '\n' + "请输入编号进行查看ck，q退出");
            let input = await s.waitInput(() => { }, 60);
            if (input.getMsg() == "q" || input.getMsg() == "Q") {
                await s.reply("已退出");
                return;
            }
            // 将用户输入的账号编号转换为数字
            let accountIndex = parseInt(input.getMsg(), 10);
            if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= userInfo.accounts.length) {
                s.reply("输入的编号无效");
                return;
            }
            // 根据编号寻找对应的账号，执行输出account.elmck操作
            let account = userInfo.accounts[accountIndex];
            let vaild = await testCookie(account.elmck);
            if (vaild = false) {
                let ckmsg = await s.reply(account.elmck + "\n" + account.username + "已失效");
                console.log("已失效" + account.elmck);
                await s.delMsg(ckmsg, { wait: 10 });

            } else {
                let ckmsg = await s.reply(account.elmck);
                console.log(account.elmck);
                await s.delMsg(ckmsg, { wait: 10 });
            }
        }
    }
    //qlsync
    async function qlsyncFunction(env, ql, targetql) {
        config = await getqlconfig(ql);
        client = new QLClient(config);
        let envs = await client.searchEnv(env)
        for (let env of envs) {
            config = await getqlconfig(targetql);
            client = new QLClient(config);
            await addenv(env.name, env.value, env.remarks);
        }
    }
    //qlconfig
    async function qlconfigFunction() {
        await s.isAdmin() && (async () => {

            const keys = await qldb.keys();
            const qlkeys = keys.filter(key => !key.includes("token"));
            const qlConfigs = [];
            for (const key of qlkeys) {
                const config = await getqlconfig(key);
                qlConfigs.push(config);
            }
            // console.log(qlConfigs); // 所有配置数组
            // 对象形式
            const qls = {};
            console.log(qlkeys)
            qlConfigs.forEach((config, index) => {
                qls[`ql${index}`] = {
                    host: config.host,
                    client_id: (AmTool.Masking(config.id, 1, 2)),
                    client_secret: (AmTool.Masking(config.secret, 2, 3)),
                };
            })
            // s.reply("ql配置\n" + JSON.stringify(qls, null, 2));
            let output = '';
            for (const key in qls) {
                output += `${key}配置:\n`
                const ql = qls[key];
                for (const prop in ql) {
                    output += `\u0020\u0020${prop}: ${ql[prop]}\n`;
                }
                output += '\n';
            }
            s.reply(output);
            const qlKey = await s.waitInput(() => { }, 10) ?? s.reply('超时,已退出');
            //config[prop] = newValue; 
            //delete config.token;
            //await qldb.set(qlKey, config);
            console.log(qls);
        })();
    }
    //查询青龙接口
    async function getToken() {
        const keys = await qldb.keys();
        const qlkeys = keys.filter(key => !key.includes("token"));
        for (const qlKey of qlkeys) {
            const qlConfig = await qldb.get(qlKey);
            console.log("正在查询青龙接口");
            const { host, client_id, client_secret } = qlConfig;
            let token
            let url = `http://${host}/open/auth/token?client_id=${client_id}&client_secret=${client_secret}`;
            let body = ``
            let options = populateOptions(url, token, body);
            console.log(url);
            try {
                const response = await got.get(options);
                console.log(response.body);
                let result = response.body;
                if (result.code == 200) {
                    token = result.data.token;
                    await qldb.set(qlKey + ".token", token);
                    console.log(`${qlKey}查询青龙接口成功`);
                } else {
                    console.log(`查询青龙接口失败: ${result.message}`);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    function populateOptions(url, auth, body = '') {
        let options = {
            url: url,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            responseType: 'json',
            timeout: 5000,
        }
        if (body) options.body = body;
        if (auth) options.headers.Authorization = 'Bearer ' + auth;
        return options;
    }
    //testCookie
    async function testCookie(cookie) {
        const options = {
            method: 'GET',
            url: 'https://restapi.ele.me/eus/v5/user_detail',
            headers: {
                Cookie: cookie,  // 使用参数 cookie 设置 Cookie 头
                'user-agent': 'Rajax/1 Apple/iPhone9,2 iOS/14.8.1 Eleme/11.0.8 ID/50E26F2E-64B8-46BE-887A-25F7BEB4D762; IsJailbroken/1 Mozilla/5.0 (iPhone; CPU iPhone OS 14_8_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(ELMC/11.0.8) UT4Aplus/ltracker-0.2.30.33 WindVane/8.7.2 1242x2208 PHA/2.0.0 WK (PHATemplate)',
                host: 'restapi.ele.me',
            },
        };

        try {
            const response = await got(options);
            const responseBody = JSON.parse(response.body);
            // 如果响应没有错误，那么返回响应体中的 username
            return responseBody.username;
        } catch (error) {
            const errorBody = JSON.parse(error.response.body);
            if (errorBody.name === "UNAUTHORIZED") {
                console.log("未登录，跳过该账号");
            } else {
                console.log(error.response.body);
            }
            // 如果响应有错误，那么返回 false
            return false;
        }
    }
    //查询elm个人信息
    async function fetchUserDetail(cookie, username) {
        //s.reply("正在查询elm个人信息");
        const options = {
            method: 'GET',
            url: 'https://restapi.ele.me/eus/v5/user_detail',
            headers: {
                Cookie: cookie,  // 使用全局数组中的值设置 Cookie 头
                'user-agent': 'Rajax/1 Apple/iPhone9,2 iOS/14.8.1 Eleme/11.0.8 ID/50E26F2E-64B8-46BE-887A-25F7BEB4D762; IsJailbroken/1 Mozilla/5.0 (iPhone; CPU iPhone OS 14_8_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(ELMC/11.0.8) UT4Aplus/ltracker-0.2.30.33 WindVane/8.7.2 1242x2208 PHA/2.0.0 WK (PHATemplate)',
                host: 'restapi.ele.me',
            },
        };
        config = await getqlconfig('ql');
        const client = new QLClient(config);
        try {
            const response = await got(options);
            const responseBody = JSON.parse(response.body);
            let username = responseBody.username;
            let phone = responseBody.mobile;
            s.reply(`${username} 后四位：${(AmTool.Masking(phone, 0, 4))}`);
            console.log(response.body);
            // 检查环境变量的状态，如果它被禁用，则启用它
            let envs = await client.searchEnv('elmck');
            console.log(!envs);
            let envInfo = envFindId(envs, cookie);
            console.log(envInfo);
            if (envInfo && envInfo.status === 1) {
                console.log("启用环境变量");
                await enableenv(envInfo.id);
            } else if (!envInfo) {
                console.log("添加环境变量");
                await addenv('elmck', cookie, username);
            }
        } catch (error) {
            console.log(`catch error: ${error.message}`)
            const errorBody = error.response.body;
            console.log(errorBody);
            console.log(typeof errorBody);
            let bodyObj = JSON.parse(errorBody);
            if (bodyObj.name === `UNAUTHORIZED`) {
                s.reply(username + '好像过期了,进app看一下？');
                // 禁用无效的环境变量
                let envs = await client.searchEnv('elmck');
                let envId = envFindId(envs, cookie);
                if (envId) {
                    await client.disableEnv(envId);
                }
            } else {
                console.log(error.response.body);

            }
        }
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    //accountmanager
    async function accountmanager() {
        let userInfo = await getUserInfo();
        if (!userInfo || !Array.isArray(userInfo.accounts)) {
            s.reply("未找到任何账户信息");
            return;
        }
        // 列出所有账户的编号和用户名
        let accountList = userInfo.accounts.map((account, index) => `编号：${index}，账户：${account.username}`).join('\n');
        s.reply("账户列表：\n" + accountList + '\n' + "请输入编号进行删除，q退出");
        // 等待用户输入账号编号
        let input = await s.waitInput(() => { }, 60);
        if (input.getMsg() == "q" || input.getMsg() == "Q") {
            await s.reply("已退出");
            return;
        }
        // 将用户输入的账号编号转换为数字
        let accountIndex = parseInt(input.getMsg(), 10);
        if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= userInfo.accounts.length) {
            s.reply("输入的编号无效");
            return;
        }
        // 根据编号寻找对应的账号，执行删除account操作
        userInfo.accounts.splice(accountIndex, 1);
        await usrDb.set(key, userInfo);
        s.reply("删除账户成功");
    }
    function envFindId(envs, invalidCookie) {
        let invalidEnv = envs.find((env) => env.value === invalidCookie);
        if (invalidEnv) {
            return invalidEnv._id;  // 返回找到的环境变量的 id
        } else {
            console.log(`未查询到匹配的环境变量`);
            return null;
        }
    }

    function str() {
        const str = s.getMsg();
        let sidMatch = str.match(/SID=[^;]*/);
        let cookie2Match = str.match(/cookie2=[^;]*/);

        let result = '';
        let missing = '';

        if (sidMatch) {
            result += sidMatch[0] + ';';
        } else {
            missing += 'SID is missing. ';
        }
        if (cookie2Match) {
            result += cookie2Match[0] + ';';
        } else {
            missing += 'cookie2 is missing. ';
        }

        if (missing === '') {
            //s.reply(result);
            return result;
        } else {
            s.reply(missing);
            return;
        }
    }
}