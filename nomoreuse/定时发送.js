/**
 * @author muzi
 * @name 定时发送
 * @origin muzi
 * @version 1.0.0
 * @description 定时发送消息到特定平台
 * @rule 定时发送
 * @admin false
 * @public false
 * @priority 5
 * @disable false
 * @cron 0 *\/1 1 1 * *
 */
const configs = [
	{
		message: 'Hello, this is a test message', /* 要发送的消息 */
		toSender: [
			/* 发送目的地,可以是人,可以是群,可多个 */
			{
				id: 364542087 /* id */,
				from: 'qq',
				type: 'groupId',
			},
			{
				id: -906445479 /* id */,
				from: 'pgm',
				type: 'groupId',
			},
		],
		addText: `\n\nThis is a test message sent by the script` /* 尾部增加的消息 */,
	},
];

/* main */
module.exports = async s => {
	/* 异步处理 */
	new Promise(resolve => {
		for (const config of configs) {
			let msgStr = `${config.message}${config.addText}`;
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