/**
 * @name Madrabbit短信登录
 * @rule ^短信(登录|登陆)$
 * @rule ^(登录|登陆)$
 * @author HermanWu
 * @origin HW
 * @version v1.0.0
 * @create_at 2021-12-02 12:12:12
 * @description Qrabbit短信登录，通过短信登陆新设备，抓取wsck
 * @priority 10000
 * @admin false
 * @platform wx pgm tg web qq
 * @public false
 * @disable false
 */

module.exports = async (s) => {
    const rabbit = new BncrDB("madRabbit")
    let url = await rabbit.get("addr")
    console.log(url)
    const got = require('got');
    let num = 1
    let code = ""

    async function main() {
        if (!url) {
            s.reply("Madrabbit对接地址为空  请先对接  指令: set madRabbit addr http://123.123.123.123:12345")
            return
        }

        if (url[url.length - 1] === '/') {
            url = url.substring(0, url.length - 1)
        }

        s.reply("请输入手机号：")
        const phone = await s.waitInput(() => { }, 60);
        const phonestr = phone.getMsg()
        if (phone == null) {
            s.reply("超时,已退出")
            return
        } else if (phonestr == "q" || phonestr == "Q") {
            s.reply("已退出")
            return
        }
        const SendSMSResult = SendSMS(phonestr)
        s.reply(`正在获取验证码，请稍等`)
    }

    async function SendSMS(phone) {
        const SendSMSURL = url + "/api/sendSMS"
        let SendSMSResult = await got.post(SendSMSURL, {
            "responseType": "json",
            "timeout": 60000,
            json: {
                Phone: phone,
                qlkey: num,
            }
        })
        const SendSMSResultStr = JSON.stringify(SendSMSResult.body)
        console.log('SendSMS Result: ', SendSMSResultStr)
        if (SendSMSResult.statusCode !== 200) {
            s.reply(`验证码获取失败，请联系管理员`)
            return
        }
        s.reply(`验证码已发送，请输入验证码：`)
        const code = await s.waitInput(() => { }, 60);
        let codestr = code.getMsg()
        if (code == null) {
            s.reply("超时,已退出")
            return
        } else if (codestr == "q" || codestr == "Q") {
            s.reply("已退出")
            return
        }
        VerifyCode(phone, codestr)

    }
    async function VerifyCode(phone, code) {
        let VerifyCodeUrl = url + "/api/VerifyCode"
        const body = {
            qlkey: num,
            Phone: phone,
            Code: code,
        }
        let VerifyCodeResult = await got.post(VerifyCodeUrl, {
            "responseType": "json",
            "timeout": 60 * 1000,
            json: body,
        })
        const VerifyCodeResultStr = JSON.stringify(VerifyCodeResult.body)
        console.log('VerifyCode Result: ', VerifyCodeResultStr)
        console.log(VerifyCodeResult.body)
        if (VerifyCodeResult.statusCode !== 200) {
            s.reply(`验证失败，请联系管理员`)
            return
        }  else if (VerifyCodeResult.body.success !== true) {
            s.reply(`登陆失败，${VerifyCodeResult.body.message}`)
        }
        const qlid = VerifyCodeResult.body.data.qlid
        const qlkey = VerifyCodeResult.body.data.qlkey
        getck(qlid, qlkey)
    }
    async function getck(qlid, qlkey) {
        let getckUrl = url + `/api/User?qlid=${qlid}&qlkey=${qlkey}`
        const getckResult = await got.get(getckUrl)
        const ckResult = JSON.parse(getckResult.body)
        console.log('getck Result: ', ckResult)
        let pin = ckResult.data.remarks
        let ck = ckResult.data.ck
        if (!pin) {
            s.reply('登陆失败，请确认是否是在二维码有效期内登陆。实在没办法就联系管理员吧')
            return
        }
        pin = encodeURIComponent(decodeURIComponent(pin))
        const platform = s.getFrom()
        const userId = s.getUserId()
        const pinDB = new BncrDB("pinDB")
        let value = await pinDB.get(platform + ":" + userId, false)
        if (!value) {
            value = {
                "Pin": [pin],
                "Form": platform,
                "ID": userId,
                "Name": "",
            }
        } else {
            console.log(typeof value, value)
            const pins = value["Pin"] || [];
            if (pins.indexOf(pin) === -1) {
                pins.push(pin);
                value["Pin"] = pins; // Assign pins back to value["Pin"]
            }
        }
        pinDB.set(platform + ":" + userId, value)
        s.reply(`【${pin}】登陆成功,您的ck为：${ck}`)
    }
    main()
}