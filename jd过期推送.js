/**
 * @author muzi
 * @name jd过期推送
 * @origin jd过期推送
 * @version 1.0.0
 * @description 过期推送
 * @rule ^过期推送$
 * @rule ^gqts$
 * @admin true
 * @public false
 * @priority 100
 * @disable false
 * @cron 0 1 1 * * *
 */
module.exports = async (s) => {
    /* 检测模块并安装 */
    await sysMethod.testModule(['got@11.8.5'], { install: true });
    const userId = s.getUserId();
    const QlMod = require('../红灯区/mod/AmQlMod');
    const AmTool = require('../红灯区/mod/AmTool');
    const pinDB = new BncrDB('pinDB');
    const got = require('got');
    const UA = require('../红灯区/mod/USER_AGENTS').USER_AGENT();
    const JD_API_HOST = 'https://api.m.jd.com/client.action';
    let qlDb = await QlMod.GetQlDataBase(),
        qlDbArr = qlDb['data'] ? qlDb['data'] : (qlDb['data'] = []),
        defaultNum = typeof qlDb['Default'] === 'number' ? qlDb['Default'] : 0;
    async function testck() {
        //找cookie
        let _cookie = '',
            nowAllEnv = await QlMod.GetQlAllEnvs(qlDbArr, defaultNum);
        if (!nowAllEnv.status) return await s.reply(nowAllEnv.msg);
        nowAllEnv = nowAllEnv.data;
        let pinDbs = await pinDB.keys();
        for (let pinDb of pinDbs) {
            let [keyPlatform, userId] = pinDb.split(':');
            if (keyPlatform !== 'qq') continue;
            if (keyPlatform === "ntqq") {
                keyPlatform = "qq";
            }
            const senders = [{ id: userId, type: 'userId' }];
            let pinVal = await pinDB.get(pinDb);
            let pinArr = pinVal['Pin'];
            console.log(pinArr);

            if (!pinArr) continue;

            for (let i = pinArr.length - 1; i >= 0; i--) {
                _cookie = GetPinCookie(nowAllEnv, pinArr[i]);
                if (!_cookie) {
                    console.log(`${pinArr[i]}不存在于面板${defaultNum + 1}`);
                    continue;
                } else if (!await isLoginByX1a0He(_cookie)) {
                    senders.forEach(b => {
                        let obj = {
                            platform: keyPlatform,
                            msg: `${pinArr[i]}失效,已删除`,
                            type: 'text',
                        };
                        obj[b.type] = b.id;
                        sysMethod.push(obj);
                        console.log(userId + keyPlatform);
                    });
                    console.log(`${pinArr[i]}已删除`);
                    pinArr.splice(i, 1);
                }
                await sleep(1000);
            }
            console.log(pinArr);
            pinVal['Pin'] = pinArr;
            await pinDB.set(pinDb, pinVal);
        }

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
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    await testck();
}