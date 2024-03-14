/**
 * @name Madrabbit短信登录
 * @rule ^(登录|登陆|dl)$
 * @author HermanWu
 * @origin HW
 * @version v1.0.0
 * @create_at 2021-12-02 12:12:12
 * @description Qrabbit短信登录，通过短信登陆新设备，抓取wsck
 * @priority 10000
 * @admin false
 * @platform wx pgm tg web qq ntqq
 * @public false
 * @disable false
 */
module.exports = async (s) => {
    const { randomUUID } = require('crypto');
    const path = require('path');
    const math = require('mathjs')
    const fs = require('fs');
    const got = require('got');
    const userId = await s.getUserId()
    const group_id = await s.getGroupId()
    const platform = await s.getFrom()
    const rabbit = new BncrDB("RabbitPro")
    let url = await rabbit.get("addr")
    let time = 0

    let num = 2 //test
    if (url[url.length - 1] === '/') {
        url = url.substring(0, url.length - 1)
    }
    async function main() {
        if (!url) {
            s.reply("Madrabbit对接地址为空  请先对接  指令: set RabbitPro addr http://123.123.123.123:12345")
            return
        }
        // const { question, answer, includeSquare } = generateMathQuestion();
        // if (group_id.length > 2) {
        //     let waitime = (includeSquare !== 0) ? 12 : 8
        //     s.reply(`请在${waitime}s内完成：${question}`)
        //     const answerInput = await s.waitInput(() => { }, waitime);
        //     const answerInputStr = answerInput == null ? "" : answerInput.getMsg()
        //     console.log(answerInputStr);
        //     if (answerInput == null) {
        //         s.reply("超时,已退出")
        //         return
        //     } else if (answerInputStr == "q" || answerInputStr == "Q") {
        //         s.reply("好难不会做，呜呜呜")
        //         return
        //     } else if (answerInputStr !== answer.toString()) {
        //         s.reply(`答错了，正确答案是${answer}不行看看脑子吧`)
        //         return
        //     }
        // }
        s.reply("请输入选项：\n1.扫🐴登录\n2.短信💡撸")
        const option = await s.waitInput(() => { }, 60);
        const optionstr = option.getMsg()
        if (option == null) {
            s.reply("超时,已退出")
            return
        } else if (optionstr == "q" || optionstr == "Q") {
            s.reply("已退出")
            return
        } else if (optionstr == "1") {
            await GenQrCode()
            return;
        } else if (optionstr == "2") {
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
            s.reply(`正在获取验证码，请稍等`)

            await SendSMS(phonestr)
            return;
        }
    }
    function generateMathQuestion() {
        const num1 = math.randomInt(40, 80);
        const num2 = math.randomInt(8, 15);
        const num3 = math.randomInt(11, 17);
        const num4 = math.randomInt(6, 15);

        // 随机决定是否添加平方运算
        const includeSquare = math.randomInt(0, 3); // 生成0-2的随机整数

        let question, answer;
        switch (includeSquare) {
            case 0:
                // 包含平方运算
                question = `${num2} + ${num4}^2`;
                answer = math.evaluate(question);
                break;
            case 1:
                // 仅包含基本的加法和乘法
                question = `${num1} + ${num2} * ${num3}`;
                answer = math.evaluate(question);
                break;
            case 2:
                // 求导
                const poly = `${num4}x^2 + ${num2}x + ${num3}`;
                question = `求导：${poly}`;
                answer = math.derivative(poly, 'x').toString();
                //移除answer中的*与空格
                answer = answer.replace(/\*/g, '').replace(/\s/g, '');
        }

        return { question, answer, includeSquare };
    }

    async function SendSMS(phone) {
        time ++
        const SendSMSURL = url + "/sms/sendSMS"
        let SendSMSResult = await got.post(SendSMSURL, {
            "responseType": "json",
            "timeout": 60000,
            json: {
                Phone: phone,
                container_id: num,
            }
        })
        const SendSMSResultStr = JSON.stringify(SendSMSResult.body)
        console.log('SendSMS Result: ', SendSMSResultStr)
        if (SendSMSResult.statusCode !== 200) {
            s.reply(`获取验证码失败，请联系管理员`)
            return
        }
        if (SendSMSResult.body.success === false) {
            await AutoCaptcha(phone)
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
    async function AutoCaptcha(phone) {
        const AutoCaptchaURL = url + "/sms/AutoCaptcha"
        let AutoCaptchaResult = await got.post(AutoCaptchaURL, {
            "responseType": "json",
            "timeout": 60000,
            json: {
                Phone: phone,
            }
        })
        const AutoCaptchaResultStr = JSON.stringify(AutoCaptchaResult.body)
        console.log('AutoCaptcha Result: ', AutoCaptchaResultStr)
        if (AutoCaptchaResult.statusCode !== 200) {
            s.reply(`AutoCaptcha，请联系管理员`)
            return
        }
        if (AutoCaptchaResult.body.success === false) {
            //back to sendSMS
            time < 3 ? await SendSMS(phone) : s.reply(`无法发送验证码`)
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
    async function GenQrCode() {
        let GenQrCodeUrl = url + "/api/GenQrCode"
        let option = {
            url: GenQrCodeUrl,
            headers: { "Content-Type": "application/json" },
            method: "post",
            body: {}
        }
        let GenQrCodeResult = await got.post(GenQrCodeUrl, {
            "responseType": "json",
            "timeout": 60 * 1000,
            json: {},
        })
        if (GenQrCodeResult.statusCode !== 200) {
            s.reply(`获取二维码失败，请联系管理员`)
            return
        }
        const qr = GenQrCodeResult.body.qr
        const QRCodeKey = GenQrCodeResult.body.QRCodeKey
        console.log(QRCodeKey);
        let qrdata = Buffer.from(qr, 'base64')
        const qrpath = path.join("/bncr/BncrData/public/", randomUUID() + ".png")
        const hostURL = qrpath.replace("/bncr/BncrData/public/", "http://192.168.3.6:9090/public/");//改成你的网页地址
        fs.writeFile(qrpath, qrdata, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('写入成功');
            }
        })
        //send qrcode
        const obj = {
            platform: platform,
            path: hostURL,
            type: 'image',
            msg: ''
        };
        if (group_id !== '0') {
            obj.groupId = group_id;
        } else {
            obj.userId = userId;
        }
        console.log(obj);
        await sysMethod.push(obj);
        s.reply(`请使用手机扫描二维码登陆`)
        //login status check
        await qrcheck(QRCodeKey)
        //delete QR.png
        fs.unlinkSync(qrpath)
    }
    async function qrcheck(QRCodeKey) {
        const qrcheckUrl = url + "/api/QrCheck"
        const body = {
            container_id: num,
            QRCodeKey: QRCodeKey,
            "token": ""
        }
        let n = 0
        while (true) {
            let qrcheckResult = await got.post(qrcheckUrl, {
                "responseType": "json",
                "timeout": 60 * 1000,
                json: body,
            })
            if (qrcheckResult.statusCode !== 200) {
                s.reply(`登陆失败，请联系管理员`)
                return
            }
            //wait 2s
            await new Promise((resolve) => setTimeout(resolve, 2000));
            if (qrcheckResult.body.code === 200) {
                const user_index = qrcheckResult.body.user_index
                const pin = qrcheckResult.body.pin
                await getck(pin, user_index)
                return
            }
            n++
            if (n > 30) {
                s.reply(`1 min and fuck you`)
                return
            }
        }
    }

    async function VerifyCode(phone, code) {
        let VerifyCodeUrl = url + "/sms/VerifyCode"
        const body = {
            container_id: num,
            Phone: phone,
            Code: code,
        }
        let VerifyCodeResult = await got.post(VerifyCodeUrl, {
            "responseType": "json",
            "timeout": 60 * 1000,
            json: body,
        })
        //debug
        const VerifyCodeResultStr = JSON.stringify(VerifyCodeResult.body)
        console.log('VerifyCode Result: ', VerifyCodeResultStr)

        if (VerifyCodeResult.statusCode !== 200) {
            s.reply(`验证失败，请联系管理员`)
            return
        } else if (VerifyCodeResult.body.success !== true) {
            s.reply(`登陆失败，${VerifyCodeResult.body.message}`)
        }
        const user_index = VerifyCodeResult.body.user_index
        const pin = VerifyCodeResult.body.pin
        await getck(pin, user_index)
    }
    async function getck(pin, user_index) {
        let getckUrl = url + `/api/User?container_id=${num}&user_index=${user_index}&pin=${pin}`
        console.log(getckUrl);
        const getckResult = await got.get(getckUrl)
        const ckResult = JSON.parse(getckResult.body)
        //debug
        console.log('getck Result: ', ckResult)
        let ck = ckResult.data.ck
        if (!ck) {
            return
        }
        let platform = s.getFrom();
        if (platform === "ntqq") {
            platform = "qq";
        }
        const userId = s.getUserId()
        let groupId = s.getGroupId()
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
        console.log(groupId);
        if (groupId.length < 2) {
            s.reply(`【${pin}】登陆成功,您的ck为：${ck}`)
        } else {
            s.reply(`【${pin}】登陆成功`)
        }
    }
    main()
}