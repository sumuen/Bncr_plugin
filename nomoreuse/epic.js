/**
 * @author muzi
 * @name EpicStore免费游戏查询
 * @origin Adapted from a Python script
 * @version 1.0.0
 * @description Epic Games Store免费游戏查询
 * @rule ^epic$
 * @admin false
 * @public false
 * @priority 100
 * @disable false
 * @cron 0 0 12 * * 5
 */
//从https://rsshub.app/epicgames/freegames/zh-CN提取item并发送到指定群组

//推送对象
const senders = [
    {
        id: 364542087, // 要通知的QQ群ID
        from: 'qq',
        type: 'groupId',
    },
];
const got = require('got');
const dayjs = require('dayjs');
const request = require('request');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

//获取epic信息
const fetchFreeGames = async () => {
    const rootUrl = 'https://store.epicgames.com';
    const apiUrl = 'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';

    const response = await got(apiUrl).json();

    const now = dayjs();
    const items = response.data.Catalog.searchStore.elements
        .filter(
            //结构化数据
            (item) =>
                item.promotions &&
                item.promotions.promotionalOffers &&
                item.promotions.promotionalOffers[0] &&
                dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].startDate).isBefore(now) &&
                dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].endDate).isAfter(now)
        )
        .map(async (item) => {
            let link = `https://store.epicgames.com/en-US/`;
            let isBundles = false;
            item.categories.some((category) => {
                if (category.path === 'bundles') {
                    link = `${rootUrl}/en-US/bundles/`;
                    isBundles = true;
                    return true;
                }
                return false;
            });
            const linkSlug = item.catalogNs.mappings.length > 0 ? item.catalogNs.mappings[0].pageSlug : item.offerMappings.length > 0 ? item.offerMappings[0].pageSlug : item.productSlug ? item.productSlug : item.urlSlug;
            link += linkSlug;

            let description = item.description;

            let image = item.keyImages[0].url;
            item.keyImages.some((keyImage) => {
                if (keyImage.type === 'DieselStoreFrontWide') {
                    image = keyImage.url;
                    return true;
                }
                return false;
            });
            return {
                title: item.title,
                author: item.seller.name,
                link,
                description,
                image,
                pubDate: item.promotions.promotionalOffers[0].promotionalOffers[0].startDate,
            };
        });
    return await Promise.all(items);
};
// 解析时间戳
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1
        }月${date.getDate()}日${date.getHours()}时`;
}

async function writeToJpg(url) {
    let open = false;
    const paths = path.join(process.cwd(), `BncrData/public/${randomUUID().split('-').join('') + '.png'}`);
    const jpgHttpURL = paths.replace("/bncr/BncrData/public/", "http://192.168.3.6:9090/public/");
    return new Promise((resolve, reject) => {
        let stream = request(url).pipe(fs.createWriteStream(paths));
        stream.on('finish', () => {
            resolve({ url: jpgHttpURL, path: paths });
        });
    });
};

module.exports = async s => {
    let freeGames;
    try {
        freeGames = await fetchFreeGames();
    } catch (err) {
        console.error(err);
        return;
    }

    for (const game of freeGames) {
        let name = game.title;
        let url = game.link;
        let description = game.description;
        let time = formatTime(game.pubDate);
        let imageUrl = game.image;
        let image = await writeToJpg(imageUrl);

        let msgStr = `🎮 [Epic 限免]  ${name}\n⏰ 发布时间: ${time}\n💡 游戏简介:\n${description}\n🔗 游戏链接: ${url}`;

        if (s.getFrom() === 'cron') {
            senders.forEach(e => {
                let obj = {
                    platform: e.from,
                    msg: msgStr,
                    type: 'image',
                    path: image.url,
                };
                obj[e.type] = e.id;
                sysMethod.push(obj);
            });
        } else {
            await s.reply(msgStr);
            await s.reply({
                type: 'image',
                path: image.url,
            });
        }

        try {
            fs.unlinkSync(image.path);
            console.log('Successfully deleted the image');
        } catch (err) {
            console.error('There was an error:', err);
        }
    }
};
               

    
//       senders.forEach(sender => {
//         let obj = {
//           platform: sender.from,
//           msg: msgStr,
//         };
//         obj[sender.type] = sender.id;
//         s.reply(msgStr);
//         s.reply(obj); // 使用你的发送消息函数 // 您需要将此替换为实际的发送消息的函数
//       });
//     });
//   };