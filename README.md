# Bncr_plugins

> [!IMPORTANT]
>
> 本库已适配3.0，订阅链接 https://github.com/sumuen/Bncr_plugin

本库为自用的[无界](https://github.com/Anmours/Bncr)插件

包含适配**NTQQ**项目[Lagrange.Core](https://github.com/LagrangeDev/Lagrange.Core)的适配器与一些**插件**，旧提交的代码可能难以阅读但肯定可以正常运行，完全开源随便二改，感谢Bncr群组的所有朋友们

# 插件说明

## elm.js

对接青龙与饿了么，ck同步存在本地与青龙，目前已经实现：**过期提醒**、**检测ck上车**、**ck的增删改查**、**多容器**、**设置抢券容器**、

- `elm`: 检测账号信息
- `elmgl`: 饿了么账号管理
- `elmqq`: 设置抢券账号
- `qlconfig`: 设置青龙容器

## tgstickstoqq.js

实现telegram表情到qq的一对一发送，支持单个表情与表情包内全部表情

```
sticks
```

![image-20231214212732704](http://easyimage.sumuen.gq/i/2023/12/14/z6krlb-0.png)

```js
s.reply('请使用tg对机器人发送sticks获取绑定码');
s.reply('1:进入连续发送模式\n2:发送贴纸包全部贴纸\nq:退出')
//全部表情包
    async function handleStickerDownloadAndSend() {
        const saveFolder = path.join("/bncr/BncrData/public/", sticker_set_name);
        try {
            await fs.mkdir(saveFolder);
            await downloadStickers(saveFolder);
            await convertStickers(saveFolder);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error in handling stickers: ${error.message}`);
                return;
            }
        }
        await sendStickersToUser(saveFolder, sticker_set_name);
    }
//单个表情
    async function handleSignleStickerDownloadAndSend(file_id) {
        const folder = path.join("/bncr/BncrData/public/", "tmpSticker");
        try {
            await fs.mkdir(folder, { recursive: true });
            await downloadSticker(file_id, folder);
            await convertStickers(folder,512,24);
            await sendStickersToUser(folder,"tmpSticker");
            await sleep(1000)
            await fs.rm(folder, { recursive: true });
        } catch (error) {
            console.error(`Error in handling stickers: ${error.message}`);
        }
    }
```

## Bncr_ChatGPT.js

[全新的ai chat,支持个人prompt的增删改查,他人不可见](https://github.com/sumuen/Bncr_plugin/commit/7accd8a5faa443eea21fd6e85cc8924d55b72fb2)

## btc.js

通过调用[api](https://api.gateio.ws/api/v4/spot/tickers)查询虚拟货币价格

`价格`: 默认查询['DOGE_USDT', 'BTC_USDT', 'ETH_USDT']价格

`xx价格`: 查询xx虚拟货币价格

## water.js

`water`: 根据奶酪棒中绑定的账号查询默认青龙中账号对应的ck进行单线程随机延迟浇水操作

### ip变动重启.js

*ip变动重启for双拨，多拨，需要在bncr容器中安装docker，apk add --no-cache docker-cli并重启容器，我是为了重启外部qq,go-cqhttp容器，所以重启go-cqhttp容器，如果你的qq容器名不是go-cqhttp，那么请自行修改*

## madrabbit.js

其实是适配rabbitpro的脚本，适配了短信登录和扫码登录







# 更新日志

## 12.25 

更新，增加qq适配器的引用，如果用户在一个脚本的线程中，也能被同样接收信息的qq适配器踢出群组，但是这样qq适配器机器人就必须对群白名单，就会导致重复响应，这个问题暂时无解，我不知道该怎么办

## 4.7

更新ntqq适配器，增加语音，更新gpt插件，增加openai tts,适配[pandora](https://linux.do/t/topic/49556/219)

## 5.29

更新适配3.0.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sumuen/Bncr_plugin&type=Date)](https://star-history.com/#sumuen/Bncr_plugin&Date)