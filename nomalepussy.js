/**
 * @author muzi
 * @name translate
 * @origin translate
 * @version 1.0.1
 * @description translate
 * @rule 男娘
 * @admin false
 * @public false
 * @priority 100
 * @platform ntqq qq
 * @disable false
 */
module.exports = async (s) => {
    const groupId = s.getGroupId() 
    if(!groupId) return
    let platform = 'ntqq'
    let userId = s.getUserId()
    let obj = {
        platform: platform,
        api: 'set_group_kick',
        groupId: groupId,
        userId: userId,
        msg: `1`,
        type: 'text',

}
    s.reply(sysMethod.push(obj))

}