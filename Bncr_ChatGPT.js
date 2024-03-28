/**
 * @author sumuen
 * @name Bncr_ChatGPT
 * @origin sumuen
 * @version 1.1.6
 * @description ChatGpt聊天 accessToken 版本
 * @rule ^(ai) ([\s\S]+)$
 * @rule ^(ai)$
 * @admin false
 * @public false
 * @priority 10
 * @platform ntqq qq
 * @disable false
 */
/* 
todo
1. 添加对话模型引入 ✔
2. 添加对话模型选择 gpt3.5 gpt4 gpts(联网能力) ✔
3. initPrompt,发起会话调用数据库内prompt，数据库内无数据则生成，prompt为默认，修改handleUserActions，添加当前使用模型xx
4. gpt 4 mobile 的连续对话中对于img的传递 ✔
5. handleInput对于用户输入的img的处理,如何修改ntqq适配器使其接收图片的输出为[CQ:image,file=xxx] ✔
6. 取消模型的选择，加入命令ai model ,并在第一条输出中提示当前使用模型
12.17 添加画图功能 ✔
12.19 添加backendUrl，用于调用pandoraToV1Api ✔
12.21 优化请求格式，实现连续对话中对于img的传递
2024.2.8 取消画图 backendurl  * @rule ^(画图) ([\s\S]+)$

*/
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
    const backendUrl = await chatGPTStorage.get('backendUrl');
    const user = s.getUserId();
    let name = s.getUserName();
    const groupId = s.getGroupId();
    if (groupId !== 0) name = `-来自${name}`;
    if (!apiKey) return s.reply("请输入set ChatGPT apiKey设置apiKey");
    if (!apiBaseUrl) return s.reply("请输入set ChatGPT apiBaseUrl设置apiBaseUrl");
    if (!backendUrl) return s.reply("请输入set ChatGPT backendUrl 设置imgUrl，比如：http://xx:port/v1,结尾不要带/参考项目https://github.com/Ink-Osier/PandoraToV1Api");
    //console.log(`param`, s.param(1));
    const { ChatGPTAPI } = await import('chatgpt');
    const platform = s.getFrom();
    let api = {};
    api = initializeChatGPTAPI(apiKey, apiBaseUrl, 'gpt-4');
    let opt = {
        timeoutMs: 60 * 1000,
    };
    if (s.param(1) === '画图') {
        await aiDraw();
    }
    else if (s.param(1) === 'ai') {
        let prompts = []
        try {
            prompts = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        } catch (error) {
            handleError(error);
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
        if (!s.param(2)) {
            s.reply(promptStr);
            await handleUserActions(ownPrompts, prompts);
            return;
        }
        promptStr += `3秒内自动选择默认promot\n输入a管理个人自定义prompt，q退出。`
        s.reply(promptStr);
        let promptIndex = await s.waitInput(() => { }, 3);
        console.log(promptIndex)
        if (promptIndex && promptIndex.getMsg().toLowerCase() === 'q') {
            s.reply("对话结束。", name);
            return;
        }
        if (!promptIndex) {
            promptIndex = 0;
        } else {
            promptIndex = promptIndex.getMsg();
            if (promptIndex.toLowerCase() === 'a') {
                await handleUserActions(ownPrompts, prompts);
            }
        }

        let prompt = ownPrompts[promptIndex];
        if (!prompt) {
            s.reply("对话结束。", name);
            return;
        }
        let history = [{
            role: 'system', content: [{ type: "text", text: prompt.prompt + '，另外，输出字符限制，输出50-100字' }]
        }]
        s.reply(`Let me see...`);
        history.push({ role: 'user', content: [{ type: "text", text: s.param(2) }] });
        let response
        try {
            response = await api.sendMessage(JSON.stringify(history), opt);
            console.log(response);
            await handleResponse(response, history)
            await continuousDialogue(api, opt);
        }
        catch (error) {
            handleError(error);
            //如果错误信息包含OpenAI error 429，使用gpt3.5模型继续调用
            if (error.toString().indexOf('OpenAI error 429') !== -1) {
                s.reply("gpt4模型调用失败，正在使用gpt3.5模型");
                api = initializeChatGPTAPI(apiKey, apiBaseUrl, 'gpt-3.5-turbo');
                try {
                    response = await api.sendMessage(JSON.stringify(history), opt);
                    history.push({ role: 'assistant', content: [{ type: "text", text: response.text }] });
                    console.log(response);
                    await s.reply(response.text);
                    await continuousDialogue(api, opt);
                }
                catch (error) {
                    handleError(error);
                    return;
                }

            }
            return;
        }
        async function continuousDialogue(api, opt) {
            while (true) {
                let input = await s.waitInput(() => { }, 60);
                if (!input) {
                    s.reply("对话超时。", name);
                    break;
                }

                input = input.getMsg();
                if (input.toLowerCase() === 'q') {
                    s.reply("对话结束。", name);
                    break;
                }

                history.push({
                    role: 'user', content: [{ type: "text", text: input }]
                });

                let response;
                try {
                    response = await api.sendMessage(JSON.stringify(history), opt);
                    if (response) {
                        await handleResponse(response, history)
                    } else {
                        s.reply("没有收到回答。", name);
                    }
                } catch (error) {
                    handleError(error);
                    return;
                }
            }
        }
    }
    async function aiDraw() {
        const body = {
            "model": "gpt-4-s",
            prompt: `画图 ${s.param(2)}`
        };
        const auth = `Bearer ${apiKey}`;
        try {
            const response = await got.post(backendUrl + '/images/generations', {
                json: body,
                headers: {
                    'Authorization': auth
                }
            });
            let data = JSON.parse(response.body).data;
            if (!data || !data[0] || !data[0].url) {
                throw new Error(`Data validation error in response，${response.body}}`);
            }
            let dataUrl = data[0].url;
            sendImg(platform, dataUrl)
        } catch (error) {
            handleError(error);
        }
        return;
    }
    async function handleResponse(response, history) {
        console.log(response);
        if (isValidFormat(response.text)) {
            const result = processText(response.text);
            const link = result.link;
            const lastLine = result.lastLine;
            sendImg(platform, link);
            history.push({
                role: 'assistant', content: [{ type: "image_url", image_url: { url: link } }, { type: "text", text: lastLine }]
            });
            s.reply(lastLine + name);
            return history;
        }
        else {
            let text = removeUrls(response.text);
            s.reply(text + name);
            history.push({
                role: 'assistant', content: [{ type: "text", text: text }]
            });
            return history;
        }
    }
    async function handleUserActions(ownPrompts, prompts) {
        s.reply(`1.添加prompt \n2.删除prompt \n3.修改prompt \n4.查看prompt`);
        let action = await s.waitInput(() => { }, 60);
        if (!action) {
            s.reply("对话结束。", name);
            return;
        }
        action = action.getMsg();
        if (action === '1') {
            s.reply(`请输入prompt的角色`);
            let actor = await s.waitInput(() => { }, 60);
            if (!actor) {
                s.reply("对话结束。", name);
                return;
            }
            actor = actor.getMsg();
            s.reply(`请输入prompt的内容，比如：我想让你扮演讲故事的角色。您将想出引人入胜、富有想象力和吸引观众的有趣故事。`);
            let a = await s.waitInput(() => { }, 60);
            if (!a) {
                s.reply("对话结束。", name);
                return;
            }
            s.reply(`是否使用ai丰富您的prompt？y/n`);
            let useAI = await s.waitInput(() => { }, 60);
            if (!useAI) {
                s.reply("对话结束。", name);
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
                s.reply("对话结束。", name);
                return;
            }
            index = index.getMsg();
            delPrompt = ownPrompts[index];
            let exist = false;
            //find delPrompt in prompts
            prompts.forEach((item, index) => {
                if (item.act === delPrompt.act && item.prompt === delPrompt.prompt && item.user === user) {
                    prompts.splice(index, 1);
                    exist = true;
                }
            });
            fs.writeFileSync(fullPath, JSON.stringify(prompts));
            //如果prompts中不包含delPrompt，回复删除成功，
            //否则回复删除失败
            if (exist) s.reply("删除成功");
            else s.reply("删除失败");
            return;
        }
        else if (action === '3') {
            s.reply(`请输入prompt的编号`);
            let index = await s.waitInput(() => { }, 60);
            if (!index) {
                s.reply("对话结束。", name);
                return;
            }
            index = index.getMsg();
            let changePrompt = ownPrompts[index];
            s.reply(`${ownPrompts[index].prompt}\n请输入prompt的内容`);
            let content = await s.waitInput(() => { }, 60);
            if (!content) {
                s.reply("对话结束。", name);
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
                s.reply("对话结束。", name);
                return;
            }
            index = index.getMsg();
            s.reply(`prompt的内容为：${ownPrompts[index].prompt}`);
            return;
        }
        else {
            s.reply("对话结束。", name);
            return;
        }
    }
    function removeUrls(text) {
        // 正则表达式匹配大多数网址格式
        const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
        // 将所有匹配到的网址替换为空字符串
        return text.replace(urlRegex, '');
    }
    function isValidFormat(text) {
        // 正则表达式来检测文本格式
        // 检测图像链接格式
        const imageRegex = /!\[image\]\(https?:\/\/.*?\)/;
        // 检测下载链接格式
        const downloadLinkRegex = /\[下载链接\]\(https?:\/\/.*?\)/;

        return imageRegex.test(text) && downloadLinkRegex.test(text);
    }
    function processText(text) {
        // 将文本按行分割
        const lines = text.split('\n');
        // 初始化变量来存储链接和最后一行文本
        let link = '';
        let lastLine = '';
        // 遍历每一行来查找链接
        lines.forEach(line => {
            if (line.includes('[下载链接]')) {
                // 提取链接
                const linkMatch = line.match(/\((.*?)\)/);
                if (linkMatch && linkMatch.length > 1) {
                    link = linkMatch[1];
                }
            }
        });
        // 获取最后一行文本
        if (lines.length > 0) {
            lastLine = lines[lines.length - 1];
        }
        return { link, lastLine };
    }
    function initializeChatGPTAPI(apiKey, baseUrl, model) {
        return new ChatGPTAPI({
            apiKey: apiKey,
            apiBaseUrl: baseUrl,
            completionParams: {
                model: model
            }
        });
    }
    async function handleInput(input) {
        // if (platform === 'qq') {
        // }
        // else if (platform === 'ntqq') {
        let regex = /http/g;
        // 使用match()函数检查字符串是否包含匹配的URL
        let matchedUrls = input.match(regex);
        // 如果字符串包含匹配的URL，保存图片并发送
        if (matchedUrls) {
            //通过got获取图片并保存到本地
            const { body } = await got.get(input, { responseType: 'buffer' });
            const imgpath = path.join("/bncr/BncrData/public/", randomUUID() + '.png')
            console.log(imgpath)
            fs.writeFile(imgpath, body, (err) => {
                if (err) {
                    console.error('写入文件时出错:', err);
                    return;
                }
            });
            await sleep(1000)
            let base64Img = imageToBase64(imgpath)
            fs.unlinkSync(imgpath)
            return base64Img;
        } else {
            return input;
        }
    }
    function handleError(error) {
        console.log(error);
        let errorMessage = error.message || error.toString();
        errorMessage = unicodeToChinese(errorMessage);
        s.reply("发生错误: " + errorMessage + name);
    }
    function sendImg(platform, url) {
        if (platform === 'qq') s.reply(`[CQ:image,file=${url}]`);
        else if (platform === 'ntqq') {
            const obj = {
                platform: 'ntqq',
                type: 'image',
                msg: ``,
                path: url,
                groupId: s.getGroupId(),
            }
            //console.log(obj);
            sysMethod.push(obj);
        }
    }
    function isUnicode(str) {
        // 正则表达式检查字符串是否包含Unicode转义序列
        return /\\u[\dA-F]{4}/i.test(str);
    }

    function unicodeToChinese(text) {
        // 将Unicode转义序列转换为普通字符串
        if (isUnicode(text)) {
            return text.replace(/\\u([\dA-F]{4})/gi, function (match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            });
        } else {
            return text;
        }
    }
    function imageToBase64(path) {
        try {
            // 读取文件到缓冲区
            const imageBuffer = fs.readFileSync(path);

            // 将缓冲区转换为 Base64 字符串
            const base64Image = imageBuffer.toString('base64');

            return base64Image;
        } catch (error) {
            handleError(error);
            return null;
        }
    }
};

