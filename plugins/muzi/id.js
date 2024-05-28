/**
 * @author muzi
 * @name id
 * @team muzi
 * @version 1.1.0
 * @description 获取用户id
 * @rule ^id
 * @priority 10
 * @admin false
 * @public true
 * @disable false
 * @systemVersion >=:2.0.5
 * @classification ["插件"]
*/
module.exports = async s => {
    let platform = s.getFrom();
    let id = s.getUserId();
    let name = s.getUserName();
    let groupId = s.getGroupId();
    if (groupId == 0) {

        s.reply(`消息来自${platform},id:${id},name:${name}`)
        console.log(groupId)
    } else {

        s.reply(`消息来自${platform},id:${id},name:${name},groupId:${groupId}`)
        console.log(groupId)
    }
}