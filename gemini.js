/**
 * @author muzi
 * @name gemini
 * @origin muzi
 * @version 1.0.0
 * @description gemini聊天
 * @rule ^gemini ([\s\S]+)$
 * @admin false
 * @public false
 * @priority 9999
 * @platform ntqq qq
 * @disable false
 */
module.exports = async s => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const geminiStorage = new BncrDB('gemini');
    const apiKey = await geminiStorage.get('apiKey');
    // Access your API key as an environment variable (see "Set up your API key" above)
    const genAI = new GoogleGenerativeAI(apiKey);

    async function run() {
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
        const msg = s.param(1);
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

    run();
}
