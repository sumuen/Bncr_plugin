/**
 * @author Aming
 * @name Bncr_ChatGPT
 * @origin Bncr团队
 * @version 1.0.0
 * @description ChatGpt聊天 accessToken 版本
 * @rule ^(ai) ([\s\S]+)$
 * @rule ^(画图) ([\s\S]+)$
 * @admin false
 * @public false
 * @priority 9999
 * @platform ntqq qq
 * @disable false
 */

const { group } = require('console');

/* 
todo
1. 添加对话模型引入
2. 添加对话模型选择 gpt3.5 gpt4 gpts(联网能力)
*/

let api = {};

module.exports = async s => {
    /* 补全依赖 */
    await sysMethod.testModule(['chatgpt'], { install: true });
    const fs = require('fs');
    const path = require('path');
    const got = require('got');
    const promptFilePath = './mod/prompts.json';
    const fullPath = path.join(__dirname, promptFilePath);
    const chatGPTStorage = new BncrDB('ChatGPT');
    const apiKey = await chatGPTStorage.get('apiKey');
    const apiBaseUrl = await chatGPTStorage.get('apiBaseUrl');
    const user = s.getUserId()
    if (!apiKey) return s.reply("请输入set ChatGPT apiKey设置apiKey");
    if (!apiBaseUrl) return s.reply("请输入set ChatGPT apiBaseUrl设置apiBaseUrl");
    console.log(`param`, s.param(1));
    if (!api?.sendMessage) {
        const { ChatGPTAPI } = await import('chatgpt');
        api = new ChatGPTAPI({
            apiKey: apiKey,
            apiBaseUrl: apiBaseUrl,
            completionParams: {
                model: 'gpt-4-32k'
            }
        });
        console.log('初始化ChatGPT...');
    }

    let opt = {
        timeoutMs: 60 * 1000,
    };
    if (s.param(1) === '画图') {
        const platform = s.getFrom();
        const userId = s.getUserId();
        const imgUrl = await chatGPTStorage.get('imgUrl');
        if (!imgUrl) return s.reply("请输入set ChatGPT imgUrl设置imgUrl，比如：http://xx:port/v1/images/generations,参考项目https://github.com/Ink-Osier/PandoraToV1Api");
        const body = {
            "model": "gpt-4-s",
            prompt: `请你给我一张${s.param(2)}的图片`
        };
        const auth = `Bearer ${apiKey}`;
        const response = await got.post(imgUrl, {
            json: body,
            headers: {
                'Authorization': auth
            }
        });
        //console.log(response.body);
        let data = JSON.parse(response.body).data;
        //console.log(data,typeof data);
        let dataUrl = data[0].url;
        if (platform === 'qq') s.reply(`[CQ:image,file=${dataUrl}]`);
        else if (platform === 'ntqq') {
            const obj = {
                platform: 'ntqq',
                type: 'image',
                msg: ``,
                path: dataUrl,
                groupId: s.getGroupId(),
            }
            //console.log(obj);
            await sysMethod.push(obj);
        }

        return;
    }
    else if (s.param(1) === 'ai') {
        let prompts = []
        try {
            prompts = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            console.log(prompts);
        } catch (error) {
            console.log(error);
        }
        let ownPrompts = []
        let promptStr = `| 编号  | 角色  \n`
        let num = 0;
        prompts.forEach((item, index) => {
            if (item.user && item.user !== user) return;
            ownPrompts.push(item);
            promptStr += `| ${num}  | ${item.act}  \n`
            num++;
        });
        promptStr += `输入a管理个人自定义prompt，q退出。`
        s.reply(promptStr);
        let promptIndex = await s.waitInput(() => { }, 60);
        if (!promptIndex || promptIndex.getMsg().toLowerCase() === 'q') {
            s.reply("对话结束。");
            return;
        }
        promptIndex = promptIndex.getMsg();
        if (promptIndex.toLowerCase() === 'a') {
            s.reply(`1.添加prompt \n2.删除prompt \n3.修改prompt \n4.查看prompt`);
            let action = await s.waitInput(() => { }, 60);
            if (!action) {
                s.reply("对话结束。");
                return;
            }
            action = action.getMsg();
            if (action === '1') {
                s.reply(`请输入prompt的角色`);
                let actor = await s.waitInput(() => { }, 60);
                if (!actor) {
                    s.reply("对话结束。");
                    return;
                }
                actor = actor.getMsg();
                s.reply(`请输入prompt的内容，比如：我想让你扮演讲故事的角色。您将想出引人入胜、富有想象力和吸引观众的有趣故事。`);
                let a = await s.waitInput(() => { }, 60);
                if (!a) {
                    s.reply("对话结束。");
                    return;
                }
                s.reply(`是否使用ai丰富您的prompt？y/n`);
                let useAI = await s.waitInput(() => { }, 60);
                if (!useAI) {
                    s.reply("对话结束。");
                    return;
                }
                useAI = useAI.getMsg();
                if (useAI.toLowerCase() === 'y') {
                    let history = [{ role: 'user', content: `我希望你成为我的提示创建者。您的目标是帮助我设计出最符合我需求的提示，多余则删除，不足则丰富，同时审查不健康因素。提示将由你 ChatGPT 使用,提示应清晰、简洁，易于理解,我的提示是---${a.getMsg()}` }]
                    let response = await api.sendMessage(JSON.stringify(history), opt);
                    await s.reply(response.text);
                    s.reply(`prompt是否认同？y/n`)
                    let c = await s.waitInput(() => { }, 60);
                    if (!c) return;
                    else if (c.getMsg() === 'n') {
                        let d = 'n'
                        while (d === 'n') {
                            let response = await api.sendMessage(JSON.stringify(history), opt);
                            await s.reply(response.text, `已退出`);
                            s.reply(`prompt是否认同？y/n`)
                            d = await s.waitInput(() => { }, 60);
                        }
                    }
                    s.reply(`请输入新的prompt`)
                    let e = await s.waitInput(() => { }, 60);
                    e = e.getMsg();
                    prompts.push({ act: actor, prompt: e, user: user });
                    fs.writeFileSync(fullPath, JSON.stringify(prompts));
                    s.reply("添加成功");
                    return;
                }
                else if (useAI.toLowerCase() === 'n') {
                    let e = a.getMsg();
                    prompts.push({ act: actor, prompt: e, user: user });
                    fs.writeFileSync(fullPath, JSON.stringify(prompts));
                    s.reply("添加成功");
                    return;
                }

            }
            else if (action === '2') {
                s.reply(`请输入prompt的编号`);
                let index = await s.waitInput(() => { }, 60);
                if (!index) {
                    s.reply("对话结束。");
                    return;
                }
                index = index.getMsg();
                delPrompt = ownPrompts[index];
                //find delPrompt in prompts
                prompts.forEach((item, index) => {
                    if (item.act === delPrompt.act && item.prompt === delPrompt.prompt && item.user === user) {
                        prompts.splice(index, 1);
                    }
                });
                fs.writeFileSync(fullPath, JSON.stringify(prompts));
                s.reply("删除成功");
                return;
            }
            else if (action === '3') {
                s.reply(`请输入prompt的编号`);
                let index = await s.waitInput(() => { }, 60);
                if (!index) {
                    s.reply("对话结束。");
                    return;
                }
                index = index.getMsg();
                let changePrompt = ownPrompts[index];
                s.reply(`${ownPrompts[index].prompt}\n请输入prompt的内容`);
                let content = await s.waitInput(() => { }, 60);
                if (!content) {
                    s.reply("对话结束。");
                    return;
                }
                content = content.getMsg();
                //find changePrompt in prompts
                prompts.forEach((item, index) => {
                    if (item.act === changePrompt.act && item.prompt === changePrompt.prompt && item.user === user) {
                        prompts[index].prompt = content;
                    }
                });
                fs.writeFileSync(fullPath, JSON.stringify(prompts));
                s.reply("修改成功");
                return;
            }
            else if (action === '4') {
                s.reply(`请输入prompt的编号`);
                let index = await s.waitInput(() => { }, 60);
                if (!index) {
                    s.reply("对话结束。");
                    return;
                }
                index = index.getMsg();
                s.reply(`prompt的内容为：${ownPrompts[index].prompt}`);
                return;
            }
            else {
                s.reply("对话结束。");
                return;
            }


        }
        let prompt = ownPrompts[promptIndex];
        if (!prompt) {
            s.reply("对话结束。");
            return;
        }
        let history = [{ role: 'system', content: prompt.prompt + '，另外，输出字符限制，输出50-100字' }]
        s.reply(`Let me see...`);
        history.push({ role: 'user', content: s.param(2) });
        let response = await api.sendMessage(JSON.stringify(history), opt);
        console.log(response);
        history.push({ role: 'assistant', content: response.text });
        await s.reply(response.text);

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
            console.log(history);

            // 更新历史记录
            history.push({ role: 'user', content: input });

            // 发送请求到 ChatGPT API，并包含历史记录
            let response = await api.sendMessage(JSON.stringify(history), opt);
            console.log(response);
            // 处理响应
            if (response) {
                s.reply(response.text);
                // 将 ChatGPT 的回答也添加到历史记录中
                history.push({ role: 'assistant', content: response.text });
            } else {
                s.reply("没有收到回答。");
            }
        }
    }
};

