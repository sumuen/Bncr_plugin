/**
 * @author muzi
 * @name docker！
 * @origin muzi
 * @version 1.1.0
 * @description docker容器重启开始停止更新
 * @rule ^docker (ps|start|restart|stop|update|attach)( (\w+))?$
 * @priority 1000
 * @admin true
 * @public false
 * @disable false
 */
const { exec } = require("child_process");
//获取并展示所有容器及其状态
function showContainers(s) {
    exec('docker ps -a --format "{{.Names}} {{.Status}}"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting containers: ${error}`);
            s.reply(`Error getting containers: ${error}`);
        } else {
            // 将 "Up" 和 "Exited" 替换为对应的 emoji，然后在时间前面加一个 emoji 时钟
            let output = stdout.replace(/Up/g, "✔️").replace(/Exited/g, "❌");
            //去除状态码
            output = output.replace(/\(\d+\)/g, "");
            output = output.replace(/(✔️|❌)( [\w\s]+)/g, "$1 ⏰ $2");
            console.log(`Containers:\n${output}`);
            s.reply(`Containers:\n${output}`);
        }
    });
}
//启动容器
function startContainer(containerNameOrId, s) {
    exec(`docker start ${containerNameOrId}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting container: ${error}`);
            s.reply(`Error starting container: ${error}`);
        } else {
            console.log(`Container started: ${stdout}`);
            s.reply(`Container started: ${stdout}`);
        }
    });
}
//重启容器
function restartContainer(containerNameOrId, s) {
    exec(`docker restart ${containerNameOrId}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting container: ${error}`);
            s.reply(`Error restarting container: ${error}`);
        } else {
            console.log(`Container restarted: ${stdout}`);
            s.reply(`Container restarted: ${stdout}`);
        }
    });
}
// 停止容器
function stopContainer(containerNameOrId, s) {
    exec(`docker stop ${containerNameOrId}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping container: ${error}`);
            s.reply(`Error stopping container: ${error}`);
        } else {
            console.log(`Container stopped: ${stdout}`);
            s.reply(`Container stopped: ${stdout}`);
        }
    });
}
// 使用 watchtower 更新容器
function updateContainer(s) {
    exec('docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --run-once', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error updating containers: ${error}`);
            s.reply(`Error updating containers: ${error}`);
        } else {
            console.log(`Containers updated:\n${stdout}`);
            s.reply(`Containers updated:\n${stdout}`);
        }
    });
}
module.exports = async s => {
    const action = s.param(1);
    let containerNameOrId = s.param(2);

    switch (action) {
        case 'ps':
                (s);

            break;
        case 'start':
        case 'restart':
        case 'stop':
            if (containerNameOrId) {
                // 用户已经提供了容器的名字或ID，直接进行操作
                if (action === 'start') {
                    startContainer(containerNameOrId, s);
                } else if (action === 'restart') {
                    restartContainer(containerNameOrId, s);
                } else {  // action === 'stop'
                    stopContainer(containerNameOrId, s);
                }
            } else {
                // 用户没有提供容器的名字或ID，询问用户他们想要操作的容器是哪一个
                showContainers(s);  // 显示当前所有的容器及其状态

                await s.reply("请输入要操作的容器名或容器ID");
                try {
                    const input = await s.waitInput(() => { }, 60);  // 添加空函数作为第一个参数
                    containerNameOrId = input.getMsg();
                    if (action === 'start') {
                        startContainer(containerNameOrId, s);
                    } else if (action === 'restart') {
                        restartContainer(containerNameOrId, s);
                    } else {  // action === 'stop'
                        stopContainer(containerNameOrId, s);
                    }
                } catch (error) {
                    // 用户在 60 秒内没有回应，结束操作
                    await s.reply("操作已取消");
                }
            }
            break;
        case 'update':
            updateContainer(s);
            break;
        case 'attach':
            // 这里是你的 attach 操作
            break;
        default:
            s.reply('未知的操作: ' + action);
    }
}


