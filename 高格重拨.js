/**
 * @author muzi
 * @name 高格重拨  
 * @origin muzi
 * @version 1.1.0
 * @description 重拨高格路由器
 * @rule ^重拨$
 * @priority 1000
 * @admin true
 * @public false
 * @disable false
 * @cron 0 15 18 * * *
 */
// 导入依赖
const cheerio = require('cheerio');
const axios = require('axios');
const querystring = require('querystring');
// 获取CSRF令牌和时间戳
async function getCSRFTokenAndTimestamp(url) {
    try {
      const response = await axios.get(url);
      const html = response.data;
    //   console.log(html);
  
      const csrfTokenMatch = html.match(/gocloud\.sysauth\.csrftoken\s*=\s*["']([^"']+)["']/);
      const timestampMatch = html.match(/gocloud\.sysauth\.timestamp\s*=\s*["']([^"']+)["']/);
  
      if (csrfTokenMatch && timestampMatch) {
        return {
          csrfToken: csrfTokenMatch[1],
          timestamp: timestampMatch[1],
        };
      } else {
        console.log('未找到 CSRF 令牌或时间戳。');
        return null;
      }
    } catch (error) {
      console.log('请求失败:', error);
      return null;
    }
  }
  
async function loginAndGetCookie(url, csrfToken, timestamp) {
    const data = querystring.stringify({
      userName: 'admin',
      password: 'wocaonima',  //填入你自己的账户密码
      timestamp: timestamp,
      csrftoken: csrfToken,
      newwebui: 'yes',
      username: 'admin',
      type: 'account',
    });
  
    const config = {
      method: 'post',
      url: url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };
  
    try {
      const response = await axios(config);
      if (response.status === 200 && response.data.status === 'success') {
        const cookie = response.headers['set-cookie'];
        return cookie;
      } else {
        console.log('登录失败');
        return null;
      }
    } catch (error) {
      console.log('请求失败:', error);
      return null;
    }
  }
  
  async function sendReconnectRequest(url, cookie) {
    const config = {
      method: 'get',
      url: url,
      headers: {
        Cookie: cookie,
      },
    };
  
    try {
      const response = await axios(config);
      if (response.status === 200) {
        console.log('重拨成功');
      } else {
        console.log('重拨失败');
      }
    } catch (error) {
      console.log('请求失败:', error);
    }
  }

  function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
 }
 
 module.exports = async (s) => {
   const csrfUrl = 'http://192.168.3.1/cgi-bin/webui/admin';
   const loginUrl = 'http://192.168.3.1/cgi-bin/webui/admin';
   const reconnectUrl1 = 'http://192.168.3.1/cgi-bin/webui/admin/network/iface_reconnect/wan';
   const reconnectUrl3 = 'http://192.168.3.1/cgi-bin/webui/admin/network/iface_reconnect/wan3';
 
   try {
     const { csrfToken, timestamp } = await getCSRFTokenAndTimestamp(csrfUrl);
     if (csrfToken && timestamp) {
       const cookie = await loginAndGetCookie(loginUrl, csrfToken, timestamp);
       if (cookie) {
         await sendReconnectRequest(reconnectUrl1, cookie);
         await delay(30000);  // 等30秒重拨第二个WAN口
         await sendReconnectRequest(reconnectUrl3, cookie);
         await s.reply('重拨成功');
       } else {
         await s.reply('重拨失败: 登录失败');
       }
     } else {
       await s.reply('重拨失败: 未找到CSRF令牌或时间戳');
     }
   } catch (error) {
     console.error('重拨出现错误:', error);
     await s.reply('重拨失败: 出现错误');
   }
 };