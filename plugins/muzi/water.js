/**
 * @author muzi
 * @name water
 * @team Adapted from jd_fruit_task，ck查找抄的红灯区查询
 * @version 1.0.0
 * @description 浇水
 * @rule ^浇水$
 * @rule ^js$
 * @admin false
 * @public true
 * @priority 100
 * @disable false
 * @systemVersion >=:2.0.5
 * @classification ["jd"]
 */
module.exports = async (s) => {
    /* 检测模块并安装 */
    await sysMethod.testModule(['got@11.8.5'], { install: true });
    const userId = s.getUserId();
    let form = s.getFrom();
    const QlMod = require('../红灯区/mod/AmQlMod');
    const AmTool = require('../红灯区/mod/AmTool');
    const pinDB = new BncrDB('pinDB');
    const got = require('got');
    const UA = require('../红灯区/mod/USER_AGENTS').USER_AGENT();
    const JD_API_HOST = 'https://api.m.jd.com/client.action';
    let qlDb = await QlMod.GetQlDataBase(),
        qlDbArr = qlDb['data'] ? qlDb['data'] : (qlDb['data'] = []),
        defaultNum = typeof qlDb['Default'] === 'number' ? qlDb['Default'] : 0;
    let cookie
    async function getck() {
        //找cookie
        let _cookie = '',
            nowAllEnv = await QlMod.GetQlAllEnvs(qlDbArr, defaultNum);
        if (!nowAllEnv.status) return await s.reply(nowAllEnv.msg);
        nowAllEnv = nowAllEnv.data;
        let pinDbs = await pinDB.get(`${form}:${userId}`, '');
        if (!pinDbs) return await s.reply('未绑定,请先登录');
        let pinArr = pinDbs['Pin'] || [];
        if (!pinArr.length) return await s.reply('未绑定,请先登录');
        let ckarr = [];
        for (const e of pinArr) {
            _cookie = GetPinCookie(nowAllEnv, e);
            if (!_cookie) {
                await s.reply(`${e}不存在于面板${defaultNum + 1}`);
                continue;
            }
            //test cookie
            if (!await isLoginByX1a0He(_cookie)) {
                await s.reply(`${e}已失效`);
                continue;
            } else {
                let account = {
                    'pin': e,
                    'cookie': _cookie
                }
                ckarr.push(account);
            }
            /* 随机延迟2-3秒 */
            await sysMethod.sleep(AmTool.RandomTo2(1, 2));
        }
        console.log(ckarr);
        return ckarr;
    }
    //根据pin获取cookie
    function GetPinCookie(nowAllEnv, pin) {
        let cookie = '';
        for (const e of nowAllEnv)
            if (e['name'] === 'JD_COOKIE')
                if (e['value'].match(/(?<=pt_pin=)[^;]+/g)[0] === pin) {
                    cookie = e['value'];
                    break;
                }
        if (cookie) return cookie;
        return null;
    }
    //test cookie 
    async function isLoginByX1a0He(cookie) {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                'Cookie': cookie,
                'referer': 'https://h5.m.jd.com/',
                'User-Agent': UA,
            },
            timeout: 5000,
        };
        try {
            const response = await got.get(options.url, { headers: options.headers, timeout: 10000 });
            let data = response.body;
            if (data) {
                data = JSON.parse(data);
                if (data.islogin === '1') {
                    console.log(`使用X1a0He写的接口加强检测: Cookie有效\n`);
                    return true;
                } else if (data.islogin === '0') {
                    console.log(`使用X1a0He写的接口加强检测: Cookie无效\n`);
                    return false;
                } else {
                    console.log(`使用X1a0He写的接口加强检测: 未知返回，不作变更...\n`);
                    return false;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
    async function request(function_id, body = {}, timeout = 10000) {
        try {
            const options = taskUrl(function_id, body)
            let response = await got.get(options.url, { headers: options.headers, timeout: timeout });
            const data = JSON.parse(response.body);
            if (data) {
                //console.log(data);
                return data;
            } else {
                console.log(`京东服务器返回空数据`);
                return null;
            }
        }
        catch (e) {
            console.log(`${function_id}京东服务器访问数据为空，请检查自身设备网络情况`);
            console.log(e);
            return null;
        }
    }
    function taskUrl(function_id, body = {}) {
        return {
            url: `${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`,
            headers: {
                "Host": "api.m.jd.com",
                "Accept": "*/*",
                "Origin": "https://carry.m.jd.com",
                "Accept-Encoding": "gzip, deflate, br",
                "User-Agent": UA,
                "Accept-Language": "zh-CN,zh-Hans;q=0.9",
                "Referer": "https://carry.m.jd.com/",
                "Cookie": cookie
            },
            timeout: 10000
        }
    }
    let count = 0;
    const main = async () => {
        try {
            let response = await request("waterGoodForFarm")
            if (count === 0) {
                console.log(response);
                const totalEnergy = response.totalEnergy;
                const totalWaterTimes = response.totalWaterTimes;
                s.reply(`【${chosenAccount.pin}】浇水，启动！\n目前剩余${totalEnergy}g水滴，已经浇水${totalWaterTimes}次`);
            }
            if (response.code === "6") {

                s.reply(`已浇满`);
                return;
            }
            count++;
            const randomDelay = 3000 + Math.random() * 2000;
            console.log(`${chosenAccount.pin}第${count}次请求，延迟${randomDelay}毫秒`);
            setTimeout(main, randomDelay);
        } catch (error) {
            console.error('请求出错:', error);
        }
    };
    let ckarr = await getck();
    if (!ckarr) return;

    // 显示账号列表
    let accountList = ckarr.map((account, index) => `编号：${index}，账户：${account.pin}`).join('\n');
    await s.reply("请选择你要浇水的账号:\n" + accountList + '\n' + "请输入编号进行查看ck，q退出");

    let input = await s.waitInput(() => { }, 60);
    let userChoice = input.getMsg();

    if (userChoice === "q" || userChoice === "Q") {
        await s.reply("去死(＞。＜)");
        return;
    }
    // 将用户输入的账号编号转换为数字
    let accountIndex = parseInt(userChoice, 10);
    if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= ckarr.length) {
        await s.reply("输入的编号无效");
        return;
    }
    let chosenAccount = ckarr[accountIndex];
    cookie = chosenAccount.cookie;
    console.log(`water cookie:${cookie}`);
    main();
}
