/**
 * @author muzi
 * @name 执行邀请现金js脚本
 * @origin muzi
 * @version 1.0.0
 * @description 会话指定助力对象，助力人数，从xx开始助力，基于BBK邀请抽奖脚本
 * @rule yqxj|京西西
 * @admin false
 * @public true
 * @priority 200
 * @disable false
 */
module.exports = async s => {
    await s.reply(`请输入要助力的对象`)
    const inputA = await s.waitInput(() => { }, 60);
    // 检查用户输入
    if (inputA == null) {
        await s.reply("输入超时，已退出");
        return;
    } else if (inputA.getMsg() == "q" || inputA.getMsg() == "Q") {
        await s.reply("已退出");
        return;
    }
    const a = inputA.getMsg();

    await s.reply(`是否抽奖,1抽2不抽`);
    const inputB = await s.waitInput(() => { }, 60);

    // 检查用户输入
    if (inputB == null) {
        await s.reply("输入超时，已退出");
        return;
    }
    else if (inputB.getMsg() == "q" || inputB.getMsg() == "Q") {
        await s.reply("已退出");
        return;
    }

    let b;
    if (inputB.getMsg() === "1") {
        b = true;
    } else if (inputB.getMsg() === "2") {
        b = false;
    } else {
        await s.reply("输入错误，已退出");
        return;
    }

    //const b = inputB.getMsg();
    await s.reply(`请输入从第几个开始助力`)
    const inputC = await s.waitInput(() => { }, 60);
    // 检查用户输入
    if (inputC == null) {
        await s.reply("输入超时，已退出");
        return;
    }
    else if (inputC.getMsg() == "q" || inputC.getMsg() == "Q") {
        await s.reply("已退出");
        return;
    }
    const c = inputC.getMsg();
    sysMethod.inline(`spy立即执行 export YQCJ_HELP_PINS="${a}" \n export YQCJ_DRAW="${b}" \n export YQCJ_CK_START_INDEX="${c}"`)
    s.reply(`邀请抽奖开始了，你的命令为spy立即执行 export YQCJ_HELP_PINS="${a}" \n export YQCJ_DRAW="${b}" \n export YQCJ_CK_START_INDEX="${c}"`)
}