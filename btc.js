/**
 * @author Your Name
 * @name 虚拟货币价格查询
 * @origin Adapted from a Python script
 * @version 1.0.0
 * @description 查询虚拟货币兑USDT价格，数据基于GATEIO Exchange
 * @rule ^(?:(([a-zA-Z]{1,8})|([\u4e00-\u9fa5]{1,2}))\s*)?(价格|price)$
 * @admin false
 * @public false
 * @priority 100
 * @disable false
 */
//匹配1到8位的纯字母或1到2位的汉字。这样，监听规则将匹配空值、最多8个字母或最多2个汉字作为币种参数，并且紧跟"价格"或"price"。$ 符号确保规则仅匹配以 "价格" 或 "price" 结尾的字符串
const axios = require('axios');
const endpoint = 'https://api.gateio.ws/api/v4/spot/tickers';

module.exports = async s => {
  const parameters = s.param(1)?.trim().split(/\s+/) || [];   //从用户输入中提取参数。正则表达式

  axios.get(endpoint)                                         //使用axios发起GET请求到API端点。
    .then(function (response) {                               //如果请求成功，处理响应数据。
      const data = response.data;
      const updateTimestamp = new Date().toLocaleString();    //将当前时间转换为本地时间格式。

      const supportCoins = parameters.length > 0
        ? parameters.map(coin => coin.toUpperCase() + '_USDT')//将用户输入的币种转换为大写，并添加"_USDT"后缀。
        : ['DOGE_USDT', 'BTC_USDT', 'ETH_USDT'];

      const coins = data.reduce((acc, coin) => {              
        if (supportCoins.includes(coin.currency_pair)) {
          acc[coin.currency_pair] = coin;
        }
        return acc;
      }, {});                    
                                   
    //   在这段代码中， `acc` 是一个累积器（accumulator），它用于在遍历 `data` 数组过程中逐步构建一个新的对象。这个新对象用于存储与 `supportCoins` 匹配的币种数据。

    //   `reduce` 函数接受两个参数：一个回调函数和一个初始值。在这里，回调函数的参数是累积器 `acc` 和当前遍历的元素 `coin` 。初始值为空对象 `{}` 。
     
    //   `if (supportCoins.includes(coin.currency_pair)) { ... }` 判断当前遍历的 `coin` 是否属于 `supportCoins` 。如果是，则将这个币种数据添加到累积器 `acc` 中。
     
    //   `acc[coin.currency_pair] = coin;` 这一行将当前遍历的币种数据 `coin` 添加到累积器 `acc` 中，以 `coin.currency_pair` 作为键（key）。
     
    //  在遍历 `data` 数组的过程中， `acc` 会逐渐收集所有与 `supportCoins` 匹配的币种数据，最终构建出一个新的对象。 `reduce` 函数会返回这个新对象，将其赋值给 `coins` 变量。
     
     

      let result = '';
      supportCoins.forEach(supportCoin => {
        try {
          const coin = coins[supportCoin];
          const currencyPair = coin.currency_pair.split('_')[0];
          const price = parseFloat(coin.last).toFixed(7);
          const changePercentage = coin.change_percentage;

          result += `${currencyPair}: ${price}, 涨幅: ${changePercentage}\n`;
          //result += `更新时间: ${updateTimestamp}\n`;
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
