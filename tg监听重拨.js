/**
 * @author 薛定谔的大灰机,Heyboi
 * @name 493重拨魔改版
 * @origin 大灰机
 * @version 1.0.0
 * @description 控制493重新拨号
 * @rule IP 493|ip已被限制|IP 403
 * @priority 1000000
 * @rule ^(493重拨)(开|关)$
 * @admin false
 * @disable false
 */

// 指定监听对象，userId和groupId建议二选一即可
const listenUserId = '5859772055';
const listenGroupId = '';

// 指定通知对象，userId和groupId建议二选一即可
const UserId = '1919577580';
const groupId = '';

// 指定通知的平台
const toPlatform = 'pgm';

const { addMinutes, isPast } = require('date-fns') // 日期处理库

//key为你的重拨触发词
const key = '重拨'
module.exports = async s => {
    const db = new BncrDB('Heyboi');
    const lastRedialTimeKey = 'lastRedialTime'
    if (await s.param(1) == '493重拨') {
        if (!await s.isAdmin()) { return }
        const name = s.param(2);
        if (name == '开') {
            if (await db.set('493Switch', 'on')) {
                await s.delMsg(s.reply('设置成功，493重拨已开启'), 5);
            } else { await s.delMsg(s.reply('设置失败'), 5) }
        } else {
            if (await db.set('493Switch', 'off')) {
                await s.delMsg(s.reply('设置成功，493重拨已关闭'), 5);
            } else { await s.delMsg(s.reply('设置失败'), 5) }
        }
        return
    }

    const status = await db.get('493Switch')
    if (status == 'on') {
        // 获取上次拨号的时间
        const lastRedialTimeString = await db.get(lastRedialTimeKey)
        console.log('上次拨号时间：' + lastRedialTimeString)
        const lastRedialTime = lastRedialTimeString ? new Date(lastRedialTimeString) : null
        const now = new Date()

        if (!(await s.getUserId() == listenUserId)) {
            console.log(s.getUserId())
            console.log('id不匹配')
            return
        }
        
        // 如果上次拨号时间+3分钟仍然在当前时间之后，那么直接返回，不执行重拨
         else if (lastRedialTime && !isPast(addMinutes(lastRedialTime, 3))) {
            console.log('距离上次拨号未满3分钟，不执行重拨')
            return
        }


        // 更新上次拨号时间为当前时间
        await db.set(lastRedialTimeKey, now.toString())

        let obj = {
            from: 'pgm', // 这里需要根据实际情况填写
            type: 'UserId', // 或者 'groupId'，根据实际情况填写
        };
        s.reply(obj); 
        sysMethod.inline(`重拨`);
    }
}