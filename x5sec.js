/**
 * @author muzi
 * @name x5sec
 * @origin muzi
 * @version 1.1.1
 * @description ip变动重启for双拨，多拨，需要在bncr容器中安装docker，apk add --no-cache docker-cli并重启容器，我是为了重启外部qq,go-cqhttp容器，所以重启go-cqhttp容器，如果你的qq容器名不是go-cqhttp，那么请自行修改
 * @rule ^x5sec=
 * @priority 1000
 * @admin true
 * @public false
 * @disable false
 */
const QLClient = require("./mod/ql.js");
const QlMod = require('../红灯区/mod/AmQlMod');
module.exports = async (s) => {
    const qldb = new BncrDB("elm");
    const qlConfigs = await qldb.get('ql');
    let AmingqlDb = await QlMod.GetQlDataBase()
    let qlDbArr = AmingqlDb["data"] || []
    console.log(qlDbArr);
    async function getqlconfig(qlname) {
        //console.log(qlConfigs);
        // 根据name查询对应的青龙配置
        const qlConfig = qlConfigs.find(config => config.name == qlname);
        if (!qlConfig) {
            console.log(`未找到青龙配置：${qlname}`);
            return null;
        }
        // 返回该青龙配置
        return qlConfig;
    }
    async function main(s) {
        const newx5 = formatX5sec(s.getMsg())
        s.reply(newx5);
        const qlname = await getSpecificQLnames("elmqq");
        let qlconfig = await getqlconfig(qlname);
        //console.log(qlconfig);
        let client = new QLClient(qlconfig);
        //console.log(client);
        let config = await client.getConfig();
        if (config == null) {
            s.reply("get config error");
            return;
        }
        config = await client.parseConfig(config);
        console.log(config);
        const x5secValue = config['x5sec'];
        console.log(x5secValue);
        if (x5secValue == null) {
            s.reply("x5sec not found");
            return;
        }
        client.updateConfig(config,"x5sec", newx5);
        let strConfig = client.configToString(config);
        console.log(strConfig);
        const result = await client.setConfig(strConfig);
        if (result === true) {
            s.reply('配置更新成功');
            await QlMod.PutQlCrons(s, qlDbArr, 2, ' pingxingsheng_elm/ele_tjcs.js', 'run', false)
            s.reply(`run ele_tjcs.js`);
            await client.sleep(60000)
            await QlMod.PutQlCrons(s, qlDbArr, 2, 'pingxingsheng_elm/ele_femf.js', 'run', false)
            s.reply(`run ele_femf.js`);
        } else {
            s.reply('配置更新失败');
        }

    }
    // 获取特定青龙配置
    async function getSpecificQLnames(Specificdata = "elmqq") {
        const qlConfigs = await qldb.get('ql');
        let qlnames = [];

        // 遍历每一个青龙配置
        for (const qlConfig of qlConfigs) {
            // 如果该青龙配置中存在Specificdata属性
            if (qlConfig[Specificdata]) {
                qlnames.push(qlConfig.name);
            }
        }

        console.log(qlnames);  // 打印结果
        return qlnames.length > 0 ? qlnames : null;
    }
    //format x5sec
    function formatX5sec(x5sec) {
        const regex = /(x5sec=[^;]+)/;
        const match = x5sec.match(regex);
        return match ? match[1] : null;
    }

    
    main(s);
}
