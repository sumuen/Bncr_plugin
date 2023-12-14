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

`sticks` 

![image-20231214212732704](http://easyimage.muzi.studio/i/2023/12/14/z6krlb-0.png)

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



## btc.js

通过调用[api](https://api.gateio.ws/api/v4/spot/tickers)查询虚拟货币价格

`价格`: 默认查询['DOGE_USDT', 'BTC_USDT', 'ETH_USDT']价格

`xx价格`: 查询xx虚拟货币价格

## water.js

`water`: 根据奶酪棒中绑定的账号查询默认青龙中账号对应的ck进行单线程随机延迟浇水操作

## x5sec.js

监听x5sec信息，同步到青龙并运行特级厨师与魔方两个任务

## jd过期推送.js

检测到过期ck后，推送给qq个人，删除pin

## 高格重拨.js

重播高格路由器，需要手动改一下Url，改成你自己的

### ip变动重启.js

*ip变动重启for双拨，多拨，需要在bncr容器中安装docker，apk add --no-cache docker-cli并重启容器，我是为了重启外部qq,go-cqhttp容器，所以重启go-cqhttp容器，如果你的qq容器名不是go-cqhttp，那么请自行修改*

## madrabbit.js

其实是适配rabbitpro的脚本，适配了短信登录和扫码登录

## 抽奖.js

娱乐脚本，管理员输入抽奖开后，输入1即可参与抽奖

## docker.js

玩具脚本，实现docker的一些命令

*docker (ps|start|restart|stop|update|attach)( (\w+))*

![image-20231210213409772](http://easyimage.muzi.studio/i/2023/12/10/zalrzb-0.png)

