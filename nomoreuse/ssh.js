/**
 * @author muzi
 * @name ssh
 * @origin 沐恩
 * @version 1.0.0
 * @description 适配bncr的ssh
 * @rule ssh2
 * @admin false
 * @public false
 * @priority 99
 * @disable false
 */
/**
 * @author muzi
 * @name ssh
 * @origin 沐恩
 * @version 1.0.0
 * @description 适配bncr的ssh
 * @rule ssh2
 * @admin false
 * @public false
 * @priority 99
 * @disable false
 */
// 创建数据库实例
const sshDb = new BncrDB('ssh');
const { get } = require('request');
const { Client } = require('ssh2');

async function handleOutput(s, output, cmd) {
    // Remove the command
    output = output.replace(new RegExp(cmd+'\\n', 'g'), '');
    // Remove ANSI escape sequences
    output = output.replace(/\x1b\[[0-9;]*m/g, '');
    // Remove the control characters
    output = output.replace(/(\x1b\[\?2004l)|(\x1b\[\?2004h)/g, '');
    // Replace the command prompt
    output = output.replace('[?2004hroot@armbian:~#', 'root@armbian:~#');

    // 如果输出为空, 不回复，如果输出为s，不回复
    if (output === '' || output === s.getMsg()) {
        return;
    }
    console.log(s.getMsg());
    s.reply(output);
}



module.exports = async (s) => {
    //获取ssh连接信息
    async function getSSHInfo(ssh) {
        //列举数据库中ssh信息
        const sshList = await sshDb.list();
        //如果数据库中没有ssh信息，返回false
        if (sshList.length === 0) {
            return false;
        }
    }
    //是否连接已保存的ssh，并列举出已保存的ssh信息，还是新建ssh连接，提供两种方式
    const sshinfo = await getSSHInfo(ssh);
    
    await s.reply('请选择连接方式：\n1.已保存的ssh连接\n2.新建ssh连接'+sshinfo);
    // 获取连接参数
    await s.reply('请输入要连接的主机名:');
    const hostInput = await s.waitInput(() => { }, 60);
    if (!hostInput) {
        await s.reply('输入超时，已退出');
        return;
    }
    const host = hostInput.getMsg();

    await s.reply('请输入用户名:');
    const usernameInput = await s.waitInput(() => { }, 60);
    if (!usernameInput) {
        await s.reply('输入超时，已退出');
        return;
    }
    const username = usernameInput.getMsg();

    await s.reply('请输入密码:');
    const passwordInput = await s.waitInput(() => { }, 60);
    if (!passwordInput) {
        await s.reply('输入超时，已退出');
        return;
    }
    const password = passwordInput.getMsg();
    //询问用户是否保存ssh连接
    await s.reply('是否保存ssh？(y/n)');
    const saveInput = await s.waitInput(() => { }, 60);
    if (!saveInput) {
        await s.reply('输入超时，已退出');
        return;
    }
    const save = saveInput.getMsg();
    if (save === 'y') {
        // 保存ssh连接
        await sshDb.set(s.getMsg(), {
            host: host,
            username: username,
            password: password,
        });
    }

    // 创建SSH连接
    const conn = new Client();
    conn.on('ready', async () => {
        await s.reply('连接成功, 请输入要执行的命令, 输入 "q" 退出:');

        // Start shell session
        conn.shell((err, stream) => {
            if (err) throw err;

            let cmd; // Command placeholder
            stream.on('data', (data) => {
                handleOutput(s, data.toString(), cmd);
            });

            stream.stderr.on('data', (data) => {
                handleOutput(s, data.toString(), cmd);
            });

            (async function cmdLoop() {
                while (true) {
                    // 获取用户要执行的命令
                    const cmdInput = await s.waitInput(() => { }, 60);
                    if (!cmdInput) {
                        await s.reply('输入超时，已退出');
                        stream.end('exit\n'); // End the shell session
                        conn.end();
                        return;
                    }

                    cmd = cmdInput.getMsg(); // Store the command

                    // 如果用户输入 'q', 结束会话
                    if (cmd === 'q') {
                        await s.reply('已退出');
                        stream.end('exit\n'); // End the shell session
                        conn.end();
                        return;
                    }

                    // Send the command to the shell session
                    stream.write(`${cmd}\n`);
                }
            })();
        });
    }).connect({
        host: host,
        port: 22,
        username: username,
        password: password,
    });
};
