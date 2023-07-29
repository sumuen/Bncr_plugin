/**
 * @name HW-Qrabbit短信登录
 * @rule ^短信(登录|登陆)$
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
    const rabbit = new BncrDB("qRabbit")
    const url = await rabbit.get("addr")
    console.log(url)
    const got = require('got');
    let num = 1
    let code = ""

    async function main() {
        if (url == "") {
            s.reply("QRabbit对接地址为空  请先对接  指令: set otto rabbit_addr http://123.123.123.123:12345")
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

        const Phone = phone.getMsg()
        const SendSMSResult = SendSMS(Phone)
        if (!SendSMSResult) {
            return
        }

        s.reply(`正在获取验证码，请稍等`)
        const code = await s.waitInput(() => { }, 60);
        if (code == null) {
            s.reply("超时,已退出")
            return
        } else if (code.getMsg() == "q" || code.getMsg() == "Q") {
            s.reply("已退出")
            return
        }
        VerifyCode(Phone, code.getMsg())
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
        const code = SendSMSResult.body.code
        if (code !== 666) {
            s.reply(`${SendSMSResult.body.message}`)
            return
        }
        // 自动验证
        return AutoCaptcha(phone, 3)
    }

    async function AutoCaptcha(phone, tryAgain = 0) {
        let AutoCaptchaUrl = url + "/api/AutoCaptcha"
        let AutoCaptchaResult = await got.post(AutoCaptchaUrl, {
            "responseType": "json",
            "timeout": 60 * 1000,
            "json": {
                Phone: phone,
            },
        })
        const AutoCaptchaResultStr = JSON.stringify(AutoCaptchaResult.body)
        console.log('AutoCaptcha Result: ', AutoCaptchaResultStr)

        if (AutoCaptchaResult.statusCode !== 200) {
            return
        } else if (AutoCaptchaResult.body.code === 505) {
            // 获取验证码成功
            s.reply(`验证码获取成功，请输入验证码`)
            return true
        } else if (AutoCaptchaResult.body.code === 666) {
            if (tryAgain > 0) {
                s.reply(`正在图形验证，请稍等`)
                AutoCaptcha(phone, tryAgain - 1)
            } else {
                s.reply(`图形验证失败，请重新登陆`)
                return
            }
        } else {
            s.reply(`图形验证失败，请重新登陆`)
            return
        }

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
        console.log('VerifyCode Result: ', VerifyCodeResultStr, JSON.stringify(body))
        if (VerifyCodeResult.statusCode !== 200) {
            s.reply(`验证失败，请联系管理员`)
            return
        } else if (VerifyCodeResult.body.code === 555) {
            s.reply(`请先用京东app扫码授权，授权成功后再次发送“短信登陆”`)
            s.reply(`${image('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + VerifyCodeResult.body.RiskUrl)}`)
            return
        } else if (VerifyCodeResult.body.code !== 200) {
            s.reply(`登陆失败，${VerifyCodeResult.body.message}`)
        }

        let pin = VerifyCodeResult.body.pin
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
                "NotifyCode": {}
            }
            value.NotifyCode[pin] = 1
        } else {
            console.log(typeof value, value)
            const pins = value["Pin"] || [];
            if (pins.indexOf(pin) === -1) {
                pins.push(pin);
                value["Pin"] = pins; // Assign pins back to value["Pin"]
                value.NotifyCode[pin] = 1;
            }
        }
        pinDB.set(platform + ":" + userId, JSON.stringify(value))
        s.reply(`【${pin}】登陆成功`)
        return true
    }

    main()
}