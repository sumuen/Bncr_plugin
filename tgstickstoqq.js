/**
 * @author muzi
 * @name convert tg sticks to qq 
 * @description Analysis of messages using GPT-3
 * @rule ^sticks$
 * @rule ^(sticks) ([\s\S]+)$
 * @version 1.0.0
 * @priority 100001
 * @admin false
 * @origin muzi
 * @disable false
 */
const got = require('got');
const path = require('path');
const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const usrDb = new BncrDB("tg2qq");
const Token = sysMethod.config.tgBot.token;
const { randomUUID } = require('crypto');
let sticker_set_name
let saveFolder
module.exports = async (s) => {
    async function downloadSticker(sticker) {
        const baseURL = `https://api.telegram.org/bot${Token}/`;

        const fileResponse = await got.get(`${baseURL}getFile`, {
            searchParams: {
                file_id: sticker.file_id
            },
            responseType: 'json'
        });

        const file_path = fileResponse.body.result.file_path;
        console.log(`Downloading ${sticker.file_id}...${file_path}`);

        const fileURL = `https://api.telegram.org/file/bot${Token}/${file_path}`;
        saveFolder = path.join("/bncr/BncrData/public/", sticker_set_name);
        const savePath = path.join(saveFolder, file_path.split('/').pop());

        const fileData = await got.get(fileURL, { responseType: 'buffer' });
        await fs.writeFile(savePath, fileData.body);

        console.log(`Downloaded to ${savePath}`);
    }
    async function downloadStickers(sticker_set_name) {
        const baseURL = `https://api.telegram.org/bot${Token}/`;
        const saveFolder = path.join("/bncr/BncrData/public/", sticker_set_name);

        try {
            await fs.mkdir(saveFolder);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            } else {
                s.reply('文件夹已存在，直接开始发送！');
                const userId = await usrDb.get(s.getUserId());
                // 如果错误是因为文件夹已存在，那么直接调用 sendStickers 函数
                await sendStickers(sticker_set_name, userId);
                return;  // 返回，以防止执行下面的代码
            }

        }

        try {

            // 获取贴纸集信息
            const response = await got.get(`${baseURL}getStickerSet`, {
                searchParams: {
                    name: sticker_set_name
                },
                responseType: 'json'
            });

            const stickers = response.body.result.stickers;
            const downloadPromises = stickers.map(sticker => downloadSticker(sticker));
            try {
                await Promise.all(downloadPromises);
                console.log('All stickers downloaded');
            } catch (error) {
                console.error(`Error downloading stickers: ${error.message}`);
            }
            console.log(`${saveFolder}`)
            s.reply('下载完成，开始转换格式');

            await convertTgsFiles(sticker_set_name);
            await deleteTgsFiles(saveFolder);
            //编辑消息体，发送到qq
            //读取绑定的qqid
            const userId = await usrDb.get(s.getUserId());
            s.reply(`开始发送给${userId}`);
            await sendStickers(sticker_set_name, userId);
        } catch (error) {
            console.error(`Error getting sticker set: ${error.message}`);
        }

    }

    async function convertTgsFiles(sticker_set_name) {
        const dockerCommand = 'docker';
        const dockerArgs = [
            'run', '--rm',
            '-e', 'HEIGHT=320',
            '-e', 'WIDTH=320',
            '-e', 'FPS=16',
            '-v', `/data/bncr/public/${sticker_set_name}:/source`,
            'edasriyan/lottie-to-gif'
        ];
        return new Promise((resolve, reject) => {
            const dockerProcess = spawn(dockerCommand, dockerArgs);

            dockerProcess.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
                // 根据输出处理文件并发送
            });

            dockerProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            dockerProcess.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                if (code === 0) {
                    resolve();  // 如果进程成功完成，解析 promise
                } else {
                    reject(new Error(`Docker process exited with code ${code}`));  // 如果进程以非零代码退出，拒绝 promise
                }
            });
        });
    }
    async function deleteTgsFiles(folderPath) {
        try {
            const files = await fs.readdir(saveFolder);
            const deletionPromises = files
                .filter(file => file.endsWith('.tgs'))
                .map(file => fs.promises.unlink(path.join(folderPath, file)));
            await Promise.all(deletionPromises);
            console.log('All .tgs files deleted');
        } catch (error) {
            console.error(`Error deleting .tgs files: ${error.message}`);
        }
    }
    async function sendStickers(sticker_set_name, userId) {
        // 获取保存文件夹路径
        const saveFolder = path.join("/bncr/BncrData/public", sticker_set_name);

        try {
            // 异步读取文件夹中的所有文件
            const files = await fs.readdir(saveFolder);

            // 过滤出 .gif 文件
            const gifFiles = files.filter(file => file.endsWith('.gif'));

            // 创建一个senders数组，你可以根据需要添加更多的发送者
            const senders = [{
                id: userId,
                type: 'userId',
            }];

            // 创建一个 promises 数组来存储所有的发送操作
            const sendPromises = [];
            // 循环遍历所有的发送者和文件，创建发送对象，并将发送 promise 添加到 promises 数组中
            for (const sender of senders) {
                for (const filename of gifFiles) {
                    const obj = {
                        platform: "qq",
                        path: `http://127.0.0.1:9090/public/${sticker_set_name}/${filename}`,
                        type: 'image',
                    };
                    obj[sender.type] = sender.id;

                    // 假设 sysMethod.push 返回一个 promise
                    const sendPromise = sysMethod.push(obj);
                    sendPromises.push(sendPromise);
                    // 获取一个介于1000到5000之间的随机数
                    const randomDelay = getRandomDelay(300, 5000);
                    await sleep(randomDelay);

                }
            }

            // 等待所有的发送操作完成
            await Promise.all(sendPromises);
            console.log('All stickers sent');

        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }
    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // 使用方法
    //轮训usrDb,如果没有用户id数据，添加用户id数据
    let param2 = s.param(2)
    console.log(param2);

    let platform = s.getFrom();
    console.log(platform);
    if (!param2 && platform === 'pgm') {
        let userId = s.getUserId();
        let ifExist = await usrDb.get(userId);
        console.log(ifExist);
        if (!ifExist) {
            console.log(platform);
            //生成随机数用于验证
            let random = randomUUID();
            console.log(random);
            usrDb.set(userId, random);
            s.reply(`请使用qq对机器人发送\nsticks ${random}\n进行验证`);
        } else {
            s.reply('请发送贴纸');
            await s.waitInput(async (s) => {
                let msg = s.getMsg();
                if (msg === 'q') {
                    s.reply('已取消');
                } else {
                    let msg = s.getMsg();
                    s.reply(`正在下载贴纸${msg}，请稍等`);
                    console.log(msg);
                    sticker_set_name = msg;  // 设置全局变量的值
                    await downloadStickers(msg);


                }
            }, 30);
        }
    } else {//获取用户绑定码
        if (!param2) {
            s.reply('请使用pgm对机器人发送\nsticks\n获取绑定码');
            return;
        }
        param2 = param2.length
        if (param2 > 15) {
            const keys = await usrDb.keys();
            console.log(keys);  // 输出: [ '1919577580' ]

            for (const key of keys) {
                const storedRandom = await usrDb.get(key);  // 使用get方法来获取每个键对应的值
                console.log(storedRandom);
                if (storedRandom === param2) {
                    // 找到匹配项，执行绑定操作
                    let qqid = s.getUserId();
                    console.log(qqid);
                    await usrDb.set(key, qqid);  // 更新数据库中的值
                    s.reply(`tg:${key}qq:${qqid}已经成功绑定`);
                    break;  // 如果找到匹配项，退出循环
                }
            }

        }
    }
}
