/**
 * @author muzi
 * @name qubic
 * @origin qubic
 * @version 1.0.0
 * @description qubic查询，抄的
 * @rule ^qubic$
 * @admin false
 * @public false
 * @priority 100
 * @disable false
 */
module.exports = async (s) => {
    async function getData() {
        const loginBody = JSON.stringify({ userName: 'guest@qubic.li', password: 'guest13@Qubic.li', twoFactorCode: '' });
        const loginHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json-patch+json' };
        const loginResponse = await fetch('https://api.qubic.li/Auth/Login', { method: 'POST', body: loginBody, headers: loginHeaders });
        const { token } = await loginResponse.json();
        const headers = { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token };
        const response = await fetch('https://api.qubic.li/Score/Get', { headers });
        const networkStat = await response.json();
        const epochNumber = networkStat.scoreStatistics[0].epoch;
        const epoch97Begin = new Date('2024-02-21T12:00:00');
        const curEpochBegin = new Date(epoch97Begin.getTime() + (7 * (epochNumber - 97) * 24 * 60 * 60 * 1000));
        const curEpochEnd = new Date(curEpochBegin.getTime() + (7 * 24 * 60 * 60 * 1000) - 1000);
        const curEpochProgress = (Date.now() - curEpochBegin.getTime()) / (7 * 24 * 60 * 60 * 1000);
        const netHashrate = networkStat.estimatedIts;
        const netSolsPerHour = networkStat.solutionsPerHour;
        const crypto_currency = 'qubic-network';
        const destination_currency = 'usd';
        const pricesResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${crypto_currency}&vs_currencies=${destination_currency}`);
        const prices = await pricesResponse.json();
        const qubicPrice = prices[crypto_currency][destination_currency];
        return { epochNumber, curEpochBegin, curEpochEnd, curEpochProgress, netHashrate, netSolsPerHour, qubicPrice };
    }
    function formatDate(date) {
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        day = (day < 10) ? '0' + day : day;
        month = (month < 10) ? '0' + month : month;

        return year + '-' + month + '-' + day;
    }
    const offical = await getData();
    const walletdb = new BncrDB('walletdb');
    const got = require('got');
    const userId = await s.getUserId();
    let wallet = await walletdb.get(userId);
    if (!wallet) {
        s.reply('请先set walletdb id wallet绑定钱包');
        return;
    } let url = `https://pooltemp.qubic.solutions/info?miner=${wallet}&list=true`;
    console.log(url);
    let res = await got.get(url);
    let data = JSON.parse(res.body);
    let msg = '';
    if (data.devices) {
        msg += `当前纪元: ${offical.epochNumber}\n`;
        msg += `当前开始时间: ${formatDate(offical.curEpochBegin)}\n`;
        msg += `当前结束时间: ${formatDate(offical.curEpochEnd)}\n`;
        msg += `当前进度: ${offical.curEpochProgress.toFixed(2)}\n`;
        msg += `当前价格: ${offical.qubicPrice}\n`;
        msg += `当前算力：${data.iterrate.toFixed(2)}\n`;
        msg += `当前设备：${data.devices}\n`;
        msg += `当前出块：${data.solutions}\n`;
        msg += `预估每天出块：${(24 * data.iterrate * offical.netSolsPerHour / offical.netHashrate).toFixed(2)}\n`;
    }
    s.reply(msg);

}