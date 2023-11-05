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
 * @rule ^getoken$
 * @rule ^qlconfig$
 * @rule ^elmck$
 * @rule ^elmcron$
 * @rule ^migrateData$
 * @rule ^(?=.*cookie2=[^;]+;)(?=.*SID=[^;]+;)(?!.*cookie2=[^;]+;.*cookie2=[^;]+;)(?!.*SID=[^;]+;.*SID=[^;]+;)
 * @version 1.0.9
 * @priority 100001
 * @admin false
 * @origin muzi
 * @disable false
 * @cron 0 * 6,9,12,15,18,19,21 * * *
 */
const validator = require("validator")
const got = require('got');
const qldb = new BncrDB("elm");
const usrDb = new BncrDB('elmDB');
const AmTool = require("../红灯区/mod/AmTool");


module.exports = async (s) => {
    // //清空usrDb数据库
    // let keys = await usrDb.keys();  // 获取所有的 key
    // for (let key of keys) {
    //     await usrDb.del(key);
    // }

    let globalEnv = [];
    const userId = s.getUserId();
    let platform = s.getFrom();
    const key = platform + ':' + userId;
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
        case "elmqq":
            newelmqqFunction();
            break;
        case "qlconfig":
            qlconfigFunction();
            break;
        case "qlsync":
            qlsyncFunction("elmqqck", "ql0", "ql1");
            break;
        case "elmcron":
            executeCronTask();
            break;
        case "elmck":
            elmckFunction();
            break;
        case "getoken":
            getToken();
            break;
        case "migrateData":
            migrateData();
            break;
        default:
            searchspecificelm(s);
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
        let ql = {}
        ql.host = urlBody;
        ql.id = inputC.getMsg();
        ql.secret = inputD.getMsg();
        await qldb.set("ql", ql);
        //检查是否配置是否正确
        s.reply("青龙面板配置成功");
    }

    async function executeCronTask() {
        console.log("开始执行定时任务");
        //定时执行cookie检测
        config = await getqlconfig("1697731480559");
        console.log(config);
        const client = new QLClient(config);
        let keys = await usrDb.keys();  // 获取所有的 key
        for (let key of keys) {
            let userInfo = await usrDb.get(key);  // 根据 key 获取对应的 value
            for (let account of userInfo.accounts) {
                let elmck = account.elmck;
                // 使用 elmck 进行 testCookie 检查,如果有效则查验qlenv中是否存在，如果不存在则添加，如果存在但status为1则调用enableenv启用，
                //如果失效则推送失效账号并调用disableenv禁用账号
                let responseBody = await testCookie(elmck);
                let [keyPlatform, userId] = key.split(':');
                const senders = [
                    {
                        id: userId,
                        type: 'userId',
                    },
                ];
                if (responseBody) {
                    let envs = await client.searchEnv('elmck');
                    let envInfo = envFindId(envs, elmck);
                    //console.log(envInfo);
                    console.log(`${userId}+${responseBody.mobile}`)
                    if (envInfo && envInfo.status === 1) {
                        console.log("启用环境变量");
                        await enableenv(envInfo.id);
                    } else if (!envInfo) {
                        console.log("添加环境变量");
                        await client.addEnv('elmck', elmck, account.username);
                    }
                }
                if (!responseBody) {
                    console.log(`账号 '${account.username}' 的 Cookie 已失效`);
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
    async function getqlconfig(qlname) {
        const qlConfigs = await qldb.get('ql');
        console.log(qlConfigs);

        // 根据name查询对应的青龙配置
        const qlConfig = qlConfigs.find(config => config.name === qlname);
        if (!qlConfig) {
            console.log(`未找到青龙配置：${qlname}`);
            return null;
        }
        // 返回该青龙配置
        return qlConfig;
    }
    //elmfunction
    async function elmFunction() {
        // if (!s.isAdmin()) {
        //     return;
        // }
        //从elmDB中获取cookie
        let elminfo = await usrDb.get(platform + ':' + userId);
        if (!elminfo) {
            s.reply("未绑定elm账号，请直接发送elmck");
            return;
        }
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
        //查找账户
        let userInfo = await getUserInfo();

        if (userInfo) {
            let accountList = [];
            //获取抢券容器
            let qlNames = await getSpecificQLnames("elmqq");
            if (qlNames) {
                for (const qlName of qlNames) {
                    const config = await getqlconfig(qlName);
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
                }
            } else {
                // 没有找到任何配置
                s.reply("没有找到抢券的容器");
            }
        } else {
            s.reply("elm未绑定");
        }
    }
    //newelmqq
    async function newelmqqFunction() {
        //查找账户
        let userInfo = await getUserInfo();

        if (userInfo) {
            let accountList = [];

            //获取抢券容器
            let qlNames = await getSpecificQLnames("elmqq");
            const allEnvs = await getAllEnvsFromQLs(qlNames);
            const mergedEnvs = mergeAndDeduplicateEnvs(allEnvs);
            await supplementEnvs(allEnvs, mergedEnvs);
            generateAccountListFromMergedEnvs(mergedEnvs);
            // 遍历每一个账户，并获取其 elmck
            for (let index = 0; index < userInfo.accounts.length; index++) {
                const account = userInfo.accounts[index];
                const username = account.username;
                if (account.coupon === true) {
                    let logMessage = `编号：${index}，账户：${username}, 状态：已抢券\n`;
                    accountList.push(logMessage);
                } else {
                    let logMessage = `编号：${index}，账户：${username}状态：未抢券\n`;
                    accountList.push(logMessage);
                }
            }
            s.reply("账户列表：\n" + accountList.join('') + '\n' + "请输入编号进行抢券设置，q退出");
            //等待用户输入编号选择账号进行操作
            let input = await s.waitInput(() => { }, 60);
            let accountIndex = parseInt(input.getMsg(), 10);
            if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= userInfo.accounts.length) {
                s.reply("输入的编号无效");
                return;
            }
            let selectedAccount = userInfo.accounts[accountIndex];
            // let coupon = selectedAccount.coupon
            console.log(selectedAccount.coupon);
            if (selectedAccount.coupon === true) {
                selectedAccount.coupon = false
            } else {
                selectedAccount.coupon = true
            }
            await usrDb.set(platform + ':' + userId, userInfo);
            let selectedElmck = selectedAccount.elmck;
            for (const qlName of qlNames) {
                const config = await getqlconfig(qlName);
                const client = new QLClient(config);
                let envs = await client.searchEnv('elmqqck');
                let matchedEnv = envs ? envs.find((env) => env.value === selectedElmck) : null;

                if (matchedEnv) {
                    // 如果ck存在且状态为禁用，则启用之
                    if (matchedEnv.status === 1) {
                        await client.enablEnv(matchedEnv._id);
                    }
                    // 如果ck存在且状态为启用，则禁用之
                    else {
                        await client.disableEnv(matchedEnv._id);
                    }
                } else {
                    // 如果ck不存在，则添加之
                    await client.addEnv('elmqqck', selectedElmck, selectedAccount.username);
                }
            }

            s.reply(`账号${selectedAccount.username}的设置已更新`);
        }

    }
    //getAllEnvsFromQLs
    async function getAllEnvsFromQLs(qlNames) {
        let allEnvs = [];
        for (const qlName of qlNames) {
            const config = await getqlconfig(qlName);
            const client = new QLClient(config);
            const envs = await client.searchEnv('elmqqck');
            allEnvs.push({ client, envs });
        }
        return allEnvs;
    }
    // 合并并去重所有容器的envs
    function mergeAndDeduplicateEnvs(allEnvs) {
        let merged = [];
        for (const entry of allEnvs) {
            const envs = entry.envs;
            if (envs) {
                for (const env of envs) {
                    if (!merged.some(e => e.value === env.value)) {
                        merged.push(env);
                    }
                }
            } else {
                console.error("envs is not an array in one of the entries of allEnvs");
            }
        }
        return merged;
    }
    // 补齐不足的envs
    async function supplementEnvs(allEnvs, mergedEnvs) {
        for (const { client, envs } of allEnvs) {
            for (const mergedEnv of mergedEnvs) {
                if (!envs.some(e => e.value === mergedEnv.value)) {
                    await client.addEnv('elmqqck', mergedEnv.value, mergedEnv.name);
                }
            }
        }
    }
    // 根据总的合并后的envs生成账户列表
    function generateAccountListFromMergedEnvs(mergedEnvs) {
        return mergedEnvs.map((env, index) => `编号：${index}，账户：${env.remarks}, 状态：${env.status === 0 ? "已抢券" : "禁用"}`).join('\n');
    }
    // 获取特定青龙配置
    async function getSpecificQLnames(Specificdata = "host") {
        const qlConfigs = await qldb.get('ql');
        let qlnames = [];

        // 遍历每一个青龙配置
        for (const qlConfig of qlConfigs) {
            // 如果该青龙配置中存在Specificdata属性
            if (qlConfig[Specificdata]) {
                qlnames.push(qlConfig.name);
            }
        }

        console.log(qlnames);  // 打印结果
        return qlnames.length > 0 ? qlnames : null;
    }

    //searchspecificelm 
    async function searchspecificelm(s) {
        let elmck = str(s);
        // 检查 elmck 是否有效（即不为 undefined）
        if (elmck) {
            let responseBody = await testCookie(elmck);
            let username = responseBody.username
            if (responseBody) {
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
                // 获取ql下的所有容器
                const containers = await qldb.get("ql");

                if (!containers || !Array.isArray(containers)) {
                    console.error("No containers found or invalid format");
                    return;
                }

                let isExistingInAnyContainer = false;
                let isAddedInAnyContainer = false;

                for (const container of containers) {
                    const client = new QLClient(container);

                    let envs = await client.searchEnv('elmck');
                    let existsInQingLong = envs && envs.some(env => env.value == elmck);

                    if (existingAccount && existsInQingLong) {
                        isExistingInAnyContainer = true;
                    } else {
                        // 如果账户在青龙环境变量中不存在
                        if (!existsInQingLong) {
                            // 将新的 elmck 添加到青龙中
                            await client.addEnv('elmck', elmck, username);
                            isAddedInAnyContainer = true;
                        }
                    }
                }
                // 如果账户在数据库中不存在
                if (!existingAccount) {
                    // 将新的 elmck 添加到用户信息中
                    userInfo.accounts.push({ elmck, username });
                    await usrDb.set(platform + ':' + userId, userInfo);
                }

                if (isExistingInAnyContainer) {
                    s.reply(username + "的 cookie 已存在");
                } else if (isAddedInAnyContainer) {
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
            if (!vaild) {
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
        let client = new QLClient(config);
        let envs = await client.searchEnv(env)
        for (let env of envs) {
            config = await getqlconfig(targetql);
            client = new QLClient(config);
            await client.addEnv(env.name, env.value, env.remarks);
        }
    }
    //qlconfig
    async function qlconfigFunction() {
        await s.isAdmin() && (async () => {
            while (true) {
                let qlConfigs = await qldb.get('ql') || [];

                // 排序
                const sortedConfigs = qlConfigs.sort((a, b) => Number(a.name) - Number(b.name));
                // 对象形式
                const qls = {};
                let elmqqql = "";
                sortedConfigs.forEach((config, index) => {
                    if (config.elmqq) {
                        elmqqql += `ql${index} `;
                    }
                    qls[`ql${index}`] = {
                        host: config.host,
                        id: (AmTool.Masking(config.id, 2, 3)),
                        secret: (AmTool.Masking(config.secret, 2, 3)),
                    };
                });
                console.log(qls);
                let output = '';
                for (const key in qls) {
                    output += `${key}配置:\n`
                    const ql = qls[key];
                    for (const prop in ql) {
                        output += `\u0020\u0020${prop}: ${ql[prop]}\n`;
                    }
                    output += '\n';
                }
                s.reply(`面板管理\n0增加，-删除，q退出，wq保存退出\n输入q退出${output}+\na.elmqq容器：${elmqqql}`);
                const option = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                if (option.getMsg() == "q" || option.getMsg() == "Q") {
                    await s.reply("已退出");
                    return;
                }
                const optionstr = option.getMsg();
                console.log(optionstr)
                if (optionstr == "+") {
                    s.reply("please enter host");
                    let inputA = await s.waitInput(() => { }, 30) ?? s.reply('超时,已退出')
                    if (!validator.isURL(inputA.getMsg())) {
                        s.reply(`${inputA.getMsg()}这他妈叫host啊`)
                    } else {
                        let qlhost = inputA.getMsg()
                        const urlRegEx = /^https?:\/\/([a-zA-Z0-9-.]+(:[0-9]{1,5})?)(\/)?$/;
                        if (urlRegEx.test(qlhost)) {
                            // 提取URL主体部分
                            let match = qlhost.match(urlRegEx);
                            qlhost = match[1];
                            s.reply(`please enter id`)
                            let inputB = await s.waitInput(() => { }, 30) ?? s.reply('超时,已退出')
                            let id = inputB.getMsg()
                            if (id.length > 32) {
                                s.reply(`${id}这他妈叫id啊`)
                            }
                            s.reply(`please enter secret`)
                            let inputC = await s.waitInput(() => { }, 30) ?? s.reply('超时,已退出')
                            let secret = inputC.getMsg()
                            if (secret.length > 32) {
                                s.reply(`${secret}这他妈叫secret啊`)
                            }
                            let ql = {
                                host: qlhost,
                                id: id,
                                secret: secret,
                                name: Date.now().toString(),
                                elmqq: false
                            }
                            qlConfigs.push(ql);  // 把新容器添加到数组中
                            await qldb.set('ql', qlConfigs);  // 把修改后的容器列表写回到数据库中
                            s.reply(`ql${qlConfigs.length - 1}已添加${qlhost}`);
                        }
                    }
                }
                else if (optionstr == "-") {
                    s.reply("请输入要删除的容器编号");
                    let input = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                    let inputstr = input.getMsg();
                    if (inputstr == "q" || inputstr == "Q") {
                        await s.reply("已退出");
                    }
                    let inputnum = parseInt(inputstr, 10);
                    if (isNaN(inputnum) || inputnum < 0 || inputnum >= qlConfigs.length) {
                        s.reply("输入的编号无效");
                    }
                    qlConfigs.splice(inputnum, 1);  // 从数组中移除容器
                    await qldb.set('ql', qlConfigs);  // 把修改后的容器列表写回到数据库中

                    s.reply(`ql${inputnum}已删除`);
                }
                //如果输入的为数字且大于0且小于qlkeys.length，则对数据库内对应的青龙进行操作
                else if (!isNaN(optionstr) && optionstr >= 0 && optionstr < qlConfigs.length) {
                    //输出对应青龙的配置
                    let qlConfig = qlConfigs[optionstr];
                    let output = '';
                    for (let prop in qlConfig) {
                        output += `${prop}: ${qlConfig[prop]}\n`;
                    }
                    s.reply(`ql${optionstr}配置:\n${output}`);
                    s.reply("请输入要修改的配置项，host，id，secret，q退出");
                    let input = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                    let inputstr = input.getMsg();
                    if (inputstr == "q" || inputstr == "Q") {
                        await s.reply("已退出");
                    }
                    if (inputstr == "host") {
                        s.reply("请输入host");
                        let inputA = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                        let inputstrA = inputA.getMsg();
                        if (validator.isURL(inputstrA)) {
                            // 提取URL主体部分
                            let match = inputstrA.match(urlRegEx);
                            qlConfig.host = match[1];
                            await qldb.set('ql', qlConfigs);
                            s.reply(`ql${optionstr}host已修改为${qlConfig.host}`);
                        } else {
                            s.reply(`${inputstrA}这他妈叫host啊`)
                        }
                    }
                    else if (inputstr == "id") {
                        s.reply("请输入id");
                        let inputB = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                        let inputstrB = inputB.getMsg();
                        if (inputstrB.length > 32) {
                            s.reply(`${inputstrB}这他妈叫id啊`)
                        } else {
                            qlConfig.id = inputstrB;
                            await qldb.set('ql', qlConfigs);
                            s.reply(`ql${optionstr}id已修改为${qlConfig.id}`);
                        }
                    }
                    else if (inputstr == "secret") {
                        s.reply("请输入secret");
                        let inputC = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                        let inputstrC = inputC.getMsg();
                        if (inputstrC.length > 32) {
                            s.reply(`${inputstrC}这他妈叫secret啊`)
                        } else {
                            qlConfig.secret = inputstrC;
                            await qldb.set('ql', qlConfigs);
                            s.reply(`ql${optionstr}secret已修改为${qlConfig.secret}`);
                        }
                    }
                    else {
                        s.reply("输入的配置项无效");
                    }
                }
                //设置elmqq青龙
                else if (optionstr == "a") {
                    s.reply("请输入要设置的容器编号");
                    let input = await s.waitInput(() => { }, 20) ?? s.reply('超时,已退出');
                    let inputstr = input.getMsg();
                    if (inputstr == "q" || inputstr == "Q") {
                        await s.reply("已退出");
                    }
                    let inputnum = parseInt(inputstr, 10);
                    if (isNaN(inputnum) || inputnum < 0 || inputnum >= qlConfigs.length) {
                        s.reply("输入的编号无效");
                    }
                    qlConfigs[inputnum].elmqq = true;
                    await qldb.set('ql', qlConfigs);
                    s.reply(`设置成功`);
                }
            }
        })();
    }
    //重构数据库
    async function migrateData() {
        const allKeys = await qldb.keys();
        const oldContainerKeys = allKeys.filter(key => key.startsWith('ql') && !key.includes('token'));
        const newContainersArray = [];

        for (const key of oldContainerKeys) {
            const container = await qldb.get(key);
            newContainersArray.push(container);
            await qldb.del(key); // 选项：可以删除旧的数据结构
        }

        await qldb.set('ql', newContainersArray); // 将所有容器存储在新的'ql'键下
    }

    //查询青龙接口
    async function getToken() {
        const containers = await qldb.get("ql"); // 直接从'ql'键获取所有容器
        if (!containers || !Array.isArray(containers)) {
            console.error("No containers found or invalid format");
            return;
        }

        for (const container of containers) {
            console.log("正在查询青龙接口");
            const { host, id, secret, name } = container;

            let url = `http://${host}/open/auth/token?client_id=${id}&client_secret=${secret}`;
            let body = ``;
            let options = populateOptions(url); // 不需要传token来获取新的token
            console.log(url);

            try {
                const response = await got.get(options);
                console.log(response.body);
                let result = response.body;

                if (result.code == 200) {
                    const token = result.data.token;
                    // 更新容器的token
                    container.token = token;
                    console.log(`ql${name}查询青龙接口成功`);
                } else {
                    console.log(`查询青龙接口失败: ${result.message}`);
                }
            } catch (error) {
                console.error(error);
            }
        }

        // 保存所有更新后的容器到数据库
        await qldb.set("ql", containers);
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
            console.log(response.body)
            return responseBody;
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
        config = await getqlconfig('1697731480559');
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
                await client.addEnv('elmck', cookie, username);
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
        let userid = str.match(/USERID=[^;]*/);
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
        if (userid) {
            result += userid[0] + ';';
        } else {
            missing += 'USERID is missing. ';
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
