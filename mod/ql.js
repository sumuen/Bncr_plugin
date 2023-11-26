const got = require("got");
class QLClient {

    constructor({ host, token }) {
        this.host = host;
        this.token = token;
    }
    //searchEnv
    async searchEnv(envName = "elmck") {
        let url = `http://${this.host}/open/envs?searchValue=${envName}`
        let body = ``
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.get(options);
            //console.log(response.body);
            let result = response.body;
            if (result.code == 200) {
                let envs = result.data;
                let env = envs.filter((env) => env.name === envName);
                if (env.length > 0) { // 如果找到了匹配的环境变量
                    for (let i = 0; i < env.length; i++) {
                        await sleep(100);
                        console.log(`${env[i].value}`);
                    }
                    return env;
                } else {
                    console.log(`未查询到环境变量：${envName}`);
                    return;
                }
            } else {
                console.log("查询环境变量失败")
            }
        } catch (error) {
            console.error(error);
        }
    }
    //addenv
    async addEnv(envName, envValue, remarks = "",) {
        let url = `http://${this.host}/open/envs`;
        let param = { value: envValue, name: envName, remarks };
        let body = JSON.stringify([param]);
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.post(options);
            let result = response.body;
            if (result.code == 200) {
                console.log(`添加环境变量成功`);
            } else {
                console.log(`添加环境变量失败`);
            }
        } catch (error) {
            console.error(error);
        }
    }
    //updateenv
    async updatEnv(envName, envValue) {
        let url = `http://${this.host}/open/envs`
        let body = `name=${envName}&value=${envValue}`
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.put(options);
            console.log(response.body);
            let result = response.body;
            if (result.code == 200) {
                console.log(`更新环境变量成功`);
                return result;
            } else {
                console.log(`更新环境变量失败`);
                return;
            }
        } catch (error) {
            console.error(error);
        }
    }
    //启用禁用env
    async enablEnv(envId) {
        let url = `http://${this.host}/open/envs/enable`
        let body = JSON.stringify([envId]);
        let options = this.populateOptions(url, this.token, body);
        try {
            console.log(`envId: ${envId}`);
            const response = await got.put(options);
            console.log(response.body);
            let result = response.body;
            if (result.code === 200) {
                console.log(`启用环境变量成功`);
            } else {
                console.log(`启用环境变量失败`);
            }
        } catch (error) {
            console.error(error);
        }
    }
    async disableEnv(envId) {
        let url = `http://${this.host}/open/envs/disable`;
        let body = JSON.stringify([envId]);  // 创建一个包含 id 的数组
        let options = this.populateOptions(url, this.token, body);
        try {
            console.log(`envId: ${envId}`);
            const response = await got.put(options);
            console.log(response.body);
            let result = response.body;
            if (result.code === 200) {
                console.log(`禁用环境变量成功`);
            } else {
                console.log(`禁用环境变量失败`);
            }
        } catch (error) {
            console.error(error);
        }
    }
    // qlsearchtask
    async qlsearchtask(taskName) {
        let url = `http://${this.host}/open/crons?searchValue=${taskName}`;
        let body = '';
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.get(options);
            let result = response.body;  // Need to parse the response body to a JavaScript object
            if (result.code == 200) {
                let tasks = result.data.data; // The tasks are nested in data.data
                let matchingTasks = tasks.filter((task) => task.command.includes(taskName));
                if (matchingTasks.length > 0) { // If matching tasks are found
                    for (let i = 0; i < matchingTasks.length; i++) {
                        await sleep(100);
                        console.log(`${matchingTasks[i].id}`);
                    }
                    return matchingTasks[0].id; // return the id of the first matching task
                } else {
                    console.log(`未查询到任务：${taskName}`);
                    return;
                }
            } else {
                console.log("查询任务失败");
            }
        } catch (error) {
            console.error(error);
            s.reply(`查询青龙任务失败: ${error.message}`);
        }
    }
    //qlruntask
    async qlruntask(taskid) {
        let url = `http://${this.host}/open/crons/run`
        let body = JSON.stringify([taskid]);
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.put(options);
            console.log(response.body);
            let result = response.body;
            if (result.code == 200) {
                console.log(`运行任务成功`);
            } else {
                console.log(`运行任务失败`);
            }
        } catch (error) {
            console.error(error);
            s.reply(`运行任务失败: ${error.message}`);
        }
    }
    //searchLatestLog
    async searchLatestLog(task, date) {
        console.log(`Searching for latest log for ${task} on ${date}`);
        let url = `http://${this.host}/open/logs`;
        let options = this.populateOptions(url, this.token);
        try {
            const response = await got(options);
            const data = response.body;
            // 查找匹配的主目录
            const matchedDir = data.dirs.find(d => d.name === task);
            if (!matchedDir) {
                console.log(`没有找到关于 ${task} 的目录`);
                return null;
            }
            if (!matchedDir.files) {
                console.log(`目录 ${task} 中没有日志文件`);
                return null;
            }
            const latestLog = matchedDir.files.filter(filename => {
                return filename.includes(date);
            }).sort((a, b) => b.mtime - a.mtime)[0];
            console.log(`最新日志: ${latestLog}`);
            return `${latestLog}/${task}`;

        } catch (error) {
            console.error(`获取日志列表失败: ${error.message}`);
            return null;
        }
    }
    //getlogs
    async getlogs(key, username) {
        if (!key) {
            console.log("请提供有效的日志key");
            return null;
        }
        const [logFileName, parentDir] = key.split('/');
        // 根据父目录名和日志文件名生成日志的URL
        let url = `http://${this.host}/open/logs/${parentDir}/${logFileName}`;
        let logDateTime = key.slice(0, -4); // 去除时间戳后的.log
        let parts = logDateTime.split('-');
        let formattedStr = parts[1] + '.' + parts[2] + ' ' + parts[3] + ':' + parts[4];
        console.log(formattedStr); // 输出为: '07.27 14:08, 未去掉日期前的0'
        // 如果你希望日期前不要有0，可以使用parseInt进行转换：
        let formattedStrNoZero = parseInt(parts[1]) + '.' + parseInt(parts[2]) + ' ' + parts[3] + ':' + parts[4];
        console.log(`获取日志详情: ${url}`);
        const options = this.populateOptions(url, this.token);
        try {
            const response = await got(options);
            console.log(response.body);
            let result = response.body.data;
            return response.body;
        } catch (error) {
            console.error(`获取日志详情失败: ${error.message}`);
            return null;
        }
    }
    //getconfig
    async getConfig() {
        let url = `http://${this.host}/open/configs/config.sh`;
        let options = this.populateOptions(url, this.token);
        try {
            const response = await got(options);
            console.log(response.body);
            let result = response.body.data;
            return result;
        } catch (error) {
            console.error(`获取配置失败: ${error.message}`);
            return null;
        }
    }
    //setconfig
    async setConfig(config) {
        let url = `http://${this.host}/open/configs/save`;
        let content = config;
        let body = JSON.stringify({
            name: 'config.sh',
            content: content,
        });
        let options = this.populateOptions(url, this.token, body);
        try {
            const response = await got.post(options);
            console.log(response.body);
            let result = response.body;
            if (result.code == 200) {
                console.log(`更新配置成功`);
                return true;
            } else {
                console.log(`更新配置失败`);
                return false;
            }
        } catch (error) {
            console.error(error);
            return error;
        }
    }
    parseConfig(configStr) {
        const config = {};
        const lines = configStr.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                if (line.includes('=')) {
                    const indexOfFirstEqual = line.indexOf('=');
                    let key = line.substring(0, indexOfFirstEqual).replace(/export\s+/, '').trim();
                    let value = line.substring(indexOfFirstEqual + 1).trim().replace(/^"|"$/g, '');
                    config[key] = { value, line };
                } else {
                    // 保存注释和非配置行
                    config[line] = { value: null, line };
                }
            }
        });
        return config;
    }
    //populateOptions
    populateOptions(url, auth, body = '') {
        let options = {
            url: url,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            responseType: 'json',
            timeout: 5000,
        }
        if (body) options.body = body;
        if (auth) options.headers.Authorization = 'Bearer ' + auth;
        return options;
    }
    updateConfig(config, key, value) {
        if (value === undefined && config[key]) {
            delete config[key]; // 删除操作
        } else if (config[key]) {
            config[key].value = value; // 修改操作
        } else {
            config[`export ${key}`] = { value, line: `export ${key}="${value}"` }; // 添加操作
        }
    }
    configToString(config) {
        return Object.values(config).map(item => item.value === null ? item.line : `${item.line.split('=')[0].trim()}="${item.value}"`).join('\n');
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
module.exports = QLClient;
