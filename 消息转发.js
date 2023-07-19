/**
 * @author Aming
 * @description 监听某个人或群,当触发关键字,转发到指定目的地
 * @origin 红灯区
 * @version v1.0.0
 * @name 消息转发
 * @rule [\s\S]+
 * @priority 100000
 * @admin false
 * @disable false
 */

/* 
这个插件会拦截所有消息进行处理,控制台日志会由此增多
*/

/* 配置 */
const configs = [
	{
		listen: {
			/* 监听的群 */
			id: -1001897135102,
			from: 'pgm',
			type: 'groupId',
		},
		rule: ['export','https'] /* 触发到关键词将进行转发 */,
		headText: `spy插队\n`, // 新增的头部信息
		toSender: [
			/* 转发目的地,可以是人,可以是群,可多个 */
			{
				id: -906445479 /* id */,
				from: 'pgm',
				type: 'groupId',
			},
		],
		replace: [
			/* 需要替换的信息 */
			{
				old: '你好',
				new: '你不好',
			},
		],
		addText: `\n\nBncr的转发消息` /* 尾部增加的消息 */,
	},
	{
		listen: {
			/* 监听的群 */
			id: -1001895018795, // 新的群组id
			from: 'pgm',
			type: 'groupId',
		},
		rule: ['https','export'] /* 触发到关键词将进行转发 */,
		toSender: [
			/* 转发目的地,可以是人,可以是群,可多个 */
			{
				id: -906445479, // 新的目的地id
				from: 'pgm',
				type: 'groupId',
			},
		],
		replace: [
			/* 需要替换的信息 */
			{
				old: '你好',
				new: '你不好',
			},
		],
		addText: `\n\nBncr的转发消息` /* 尾部增加的消息 */,
	},
		{
		listen: {
			/* 监听的群 */
			id: -1001897135102, // 新的群组id
			from: 'pgm',
			type: 'groupId',
		},
		rule: ['抽现金',] /* 触发到关键词将进行转发 */,
		activeHours: [9, 12], 
		headText: `spy立即执行\n`, // 新增的头部信息
		toSender: [
			/* 转发目的地,可以是人,可以是群,可多个 */
			{
				id: -906445479, // 新的目的地id
				from: 'pgm',
				type: 'groupId',
			},
		],
		replace: [
			/* 需要替换的信息 */
			{
				old: '你好',
				new: '你不好',
			},
		],
		addText: `\n export YQCJ_DRAW="true" \nexport YQCJ_CK_START_INDEX="160" # 从第165个号开始助力。`/* 尾部增加的消息 */
	},
];



/* mian */
module.exports = async s => {
	/* 异步处理 */
	new Promise(resolve => {
		const msgInfo = s.msgInfo;
		for (const config of configs) {
			/* 检查当前时间是否在活动时间内 */
			let now = new Date();
			let currentHour = now.getHours();
			let activeHours = config.activeHours || [0, 24]; // 如果没有指定活动时间，就默认整天都是活动时间
			if (currentHour < activeHours[0] || currentHour >= activeHours[1]) {
				continue; // 不在活动时间内，跳过这个配置
			}
			let msgStr = msgInfo.msg,
				open = false;
			if (msgInfo.from !== config.listen.from || +msgInfo[config.listen.type] !== config.listen.id) continue;
			for (const rule of config.rule)
				if (msgInfo.msg.includes(rule))
					(open = true), config.replace.forEach(e => (msgStr = msgStr.replace(new RegExp(e.old, 'g'), e.new)));
			if (!open) break;
			let headText = config.headText || `来自${msgInfo.from}\n群:${msgInfo.groupId}\n人:${msgInfo.userId}\n\n`; // 使用config.headText代替原先的head，如果没有指定，则使用默认值
			msgStr = `${headText}${msgStr}${config.addText}`;
			config.toSender.forEach(e => {
				let obj = {
					platform: e.from,
					msg: msgStr,
				};
				obj[e.type] = e.id;
				return sysMethod.push(obj);
			});
		}
		resolve(void 0);
	});
	return 'next';
};
