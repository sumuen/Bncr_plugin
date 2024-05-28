/**
 * @author Your Name
 * @name btc
 * @team Adapted from a Python script
 * @version 1.0.0
 * @description 查询虚拟货币兑USDT价格，数据基于GATEIO Exchange
 * @rule ^(?:(([a-zA-Z]{1,8})|([\u4e00-\u9fa5]{1,2}))\s*)?(价格|price)$
 * @admin false
 * @public false
 * @priority 100
 * @disable true
 * @systemVersion >=:2.0.5
 * @classification ["crypto"]
 */
const axios = require('axios');
const endpoint = 'https://api.gateio.ws/api/v4/spot/tickers';

module.exports = async s => {
  const parameters = s.param(1)?.trim().split(/\s+/) || [];   

  axios.get(endpoint)                                         
    .then(function (response) {                               
      const data = response.data;
      const updateTimestamp = new Date().toLocaleString();   

      const supportCoins = parameters.length > 0
        ? parameters.map(coin => coin.toUpperCase() + '_USDT')
        : ['DOGE_USDT', 'BTC_USDT', 'ETH_USDT'];

      const coins = data.reduce((acc, coin) => {              
        if (supportCoins.includes(coin.currency_pair)) {
          acc[coin.currency_pair] = coin;
        }
        return acc;
      }, {});                                                  
      let result = '';
      supportCoins.forEach(supportCoin => {
        try {
          const coin = coins[supportCoin];
          const currencyPair = coin.currency_pair.split('_')[0];
          const price = parseFloat(coin.last).toFixed(7);
          const changePercentage = coin.change_percentage;

          result += `${currencyPair}: ${price}, 涨幅: ${changePercentage}\n`;
          result += `更新时间: ${updateTimestamp}\n`;
        } catch (error) {
          s.reply(`嗯？ ${supportCoin.split('_')[0]} 是个什么币O_o？`);
        }
      });

      
      s.reply(result);
    })
    .catch(function (error) {
      s.reply('无法访问到 API 服务器');
    });
};
