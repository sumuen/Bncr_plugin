/**
 * @author muzi
 * @name wstoautman  
 * @origin muzi
 * @version 1.1.0
 * @description 商品转链
 * @rule ^(https://u\.jd\.com/[\s\S]+$|https://item\.m\.jd\.com/product/[\s\S]+$)
 * @rule ^(ws)$
 * @priority 9999
 * @admin false
 * @public false
 * @disable false
 */

const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const request = require('request');
const { randomUUID } = require('crypto');

async function writeToJpg(url) {
    const paths = path.join(process.cwd(), `BncrData/public/${randomUUID().split('-').join('') + '.png'}`);
    const jpgHttpURL = paths.replace("/bncr/BncrData/public/", "http://192.168.3.6:9090/public/");
    return new Promise((resolve, reject) => {
        let stream = request(url).pipe(fs.createWriteStream(paths));
        stream.on('finish', () => {
            resolve({ url: jpgHttpURL, path: paths });
        });
    });
};

module.exports = async s => {
    const param1 = s.param(1);
    // 连接到服务器
    const ws = new WebSocket('ws://192.168.3.3:8080/ws?uid=1&pwd=2');

    async function processInput() {
        const input = await s.waitInput(() => {}, 60);
        // 检查用户输入
        if (input == null) {
            await s.reply("输入超时，已退出");
            return;
        }
        const msg = input.getMsg();
        if (msg == "q" || msg == "Q") {
            await s.reply("已退出");
            return;
        }
        ws.send(msg);
        // 循环读取用户输入，发送到服务器
        processInput();
    }

    ws.on('open', function open() {
        if (param1 === 'ws') {
            s.reply('connected');
            processInput();
        } else {
            console.log('connected');
            // 读取用户输入，发送到服务器
            const msg = param1;
            ws.send(msg);
        }
    });

    ws.on('close', function close() {
        console.log('disconnected');
    });

    // 监听服务器发送的消息
    ws.on('message', async function incoming(data) {
        if (Buffer.isBuffer(data)) {
            data = data.toString();
        }

        if (param1 === 'ws') {
            await s.reply(data);
            return;
        }

        const productLinkMatch = data.match(/(https:\/\/u\.jd\.com\/[\w\d]+)/);
        const imgLinkMatch = data.match(/src="(https:\/\/[\w\d\/\.\-]+\.jpg)"/);

        if (productLinkMatch) {
            const productLink = productLinkMatch[1];
            console.log('Product link:', productLink);
        }

        if (imgLinkMatch) {
            const imgLink = imgLinkMatch[1];
            console.log('Image link:', imgLink);
            let image = await writeToJpg(imgLink);
            await s.reply({
                type: 'image',
                path: image.url,
            });
        }

        const parts = data.split('<br /><img src=');
        if (parts.length > 0) {
            const usefulData = parts[0];
            console.log('Useful data:', usefulData);
            await s.reply(usefulData);
        }
    });
}
