/**
 * @author muzi
 * @name gemini
 * @origin muzi
 * @version 1.0.0
 * @description gemini聊天
 * @rule ^gemini ([\s\S]+)$
 * @rule ^识图$
 * @admin false
 * @public false
 * @priority 9999
 * @platform ntqq qq
 * @disable false
 */
module.exports = async s => {
    const got = require('got');
    const fs = require('fs');
    const { randomUUID } = require("crypto");
    const path = require('path');
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const geminiStorage = new BncrDB('gemini');
    const apiKey = await geminiStorage.get('apiKey');
    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(apiKey);

    async function text() {
        // For text-only input, use the gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "你好，今天怎么样",
                },
                {
                    role: "model",
                    parts: "Great to meet you. What would you like to know?",
                },
            ],
            generationConfig: {
                maxOutputTokens: 100,
            },
        })
        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        s.reply(text);
        while (true) { // 进入持续对话模式
            let input = await s.waitInput(() => { }, 60);
            if (!input) {
                s.reply("对话超时。");
                break;
            };
            input = input.getMsg();
            if (input.toLowerCase() === 'q') { // 用户可以通过输入 'exit' 来退出对话
                s.reply("对话结束。");
                break;
            }
            // 发送请求到 ChatGPT API，并包含历史记录
            let result = await chat.sendMessage(input);
            const response = await result.response;
            const text = response.text();
            console.log(text);
            s.reply(text);
        }
    }
    function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}
    async function imageAI(){
        s.reply(`请发送一张图片`)
        let a = await s.waitInput(() => { }, 60);
        if (!a) {
            s.reply("超时。");
            return;
        };
        a = a.getMsg();
        let regex = /http/g;

        // 使用match()函数检查字符串是否包含匹配的URL
        let matchedUrls = a.match(regex);
        // 如果字符串包含匹配的URL，保存图片并发送
        if (matchedUrls) {
            //通过got获取图片并保存到本地
            const { body } = await got.get(a, { responseType: 'buffer' });
            const imgpath = path.join("/bncr/BncrData/public/", randomUUID()+'.jpg')
            console.log(imgpath)
            fs.writeFile(imgpath, body, (err) => {
                if (err) {
                    console.error('写入文件时出错:', err);
                    return;
                }
            });
            await sleep(1000)
            const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

            const prompt = "你看到了什么?";
          
            const imageParts = [
                fileToGenerativePart(imgpath, "image/jpeg"),
            ];
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text();
            console.log(text);
            s.reply(text)
            fs.unlinkSync(imgpath)

        } else {
            s.reply(`无法识别图片`)
        }
    }
    function fileToGenerativePart(path, mimeType) {
        return {
            inlineData: {
                data: Buffer.from(fs.readFileSync(path)).toString("base64"),
                mimeType
            },
        };
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const msg = s.param(1);
    if (msg) {
        text();
    } else {
        await imageAI();
    }
}
