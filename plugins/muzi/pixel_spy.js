/**
 * @name pixel_spy
 * @rule ^(p)([0-9]+)$
 * @rule ^(pi)(t|f)$
 * @rule ^(pLand)$
 * @author muzi
 * @team muzi
 * @version v1.0.0
 * @description pixelSPY
 * @priority 100
 * @admin false
 * @platform tgBot pgm
 * @public true
 * @disable false
 * @systemVersion >=:2.0.5
 * @classification ["crypto"]
 */
const WebSocket = require('ws');
const fetch = require('node-fetch');
const moment = require('moment');
const listenUserId = '';
const toPlatform = 'tgBot';

module.exports = async (s) => {
    const db = new BncrDB('pixels');
    const woodSpyStatus = await db.get('woodSpy')
    let platform = s.getFrom();
    let obj
    if (platform == "system") {
        if (!woodSpyStatus && s.param(1) !== 'pLand') return
        obj = {
            platform: toPlatform,
            type: 'text',
            userId: listenUserId
        };
    }
    if (s.param(1) == 'pLand') {
        pLand("Dense")
        pLand("Light")
        return
    }
    const landNum = s.param(2)
    if (await s.param(1) == 'pi') {
        if (!await s.isAdmin()) { return }
        const name = s.param(2);
        if (name == 't') {
            if (await db.set('woodSpy', true)) {
                await s.delMsg(s.reply('设置成功，woodSpy已开启'), 5);
            } else { await s.delMsg(s.reply('设置失败'), 5) }
        } else {
            if (await db.set('woodSpy', false)) {
                await s.delMsg(s.reply('设置成功，woodSpy已关闭'), 5);
            } else { await s.delMsg(s.reply('设置失败'), 5) }
        }
        return
    }

    main(landNum);

    // Function to connect to WebSocket and log messages
    async function main(landNum) {
        try {
            const landInfo = await getLandInfo(landNum);
            await performPreliminaryRequest(landInfo);
            const session = await getSessionInfo(landInfo, landNum);
            getWs(session).then(finishTimes => {
                console.log(`finalOutput: ${finishTimes}`);
                s.reply(`finishTime: ${finishTimes}`);
            }).catch(error => {
                console.error('Error during WebSocket communication', error);
            });
        }
        catch (e) {
            console.log(e);
            return null;  // Optionally return null or more error information
        }
    }
    function processFinishTime(message) {
        if (typeof message !== 'string') {
            console.error('Invalid input: message should be a string.');
            return null;
        }

        const regex = /finishTime\s*([^\s]+)/g;
        let transformedMatches = [];
        let match;
        while ((match = regex.exec(message)) !== null) {
            if (!match[1].includes('chops')) {
                transformedMatches.push(regexTime(match[1]));
            }
        }

        return transformedMatches.length > 0 ? transformedMatches : null;
    }

    function regexTime(message) {
        const regex = /\d{13}/g;
        const matches = message.match(regex);
        let formattedDates = [];
        if (matches) {
            formattedDates = matches.map(timestamp => {
                const date = new Date(parseInt(timestamp, 10));
                return moment(date).format('HH:mm:ss');
            });
            if (obj) {
                obj.msg = `pixelSPY ${landNum} ${formattedDates.join('\n')}`;
            }
            obj ? sysMethod.push(obj) : formattedDates = formattedDates.join('\n');

            return formattedDates;

        } else {
            console.log('No timestamps found in the text.');
        }
    }

    async function getLandInfo(landNumber) {
        const timestamp = new Date().getTime();
        const response = await fetch(`https://pixels-server.pixels.xyz/game/findroom/pixelsNFTFarm-${landNumber}/99?v=${timestamp}`);
        return await response.json();
    }

    async function performPreliminaryRequest(land) {
        const requestOptions = {
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type',
                'Origin': 'https://play.pixels.xyz',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        };

        try {
            const response = await fetch(`https://pixels-server.pixels.xyz/matchmake/joinById/${land.roomId}/${land.server}`, requestOptions);
            const result = await response.text();
            return result;
        } catch (error) {
            console.error('Failed preliminary request:', error);
            throw error;
        }
    }

    async function getSessionInfo(land, landNum) {
        const response = await fetch(`https://pixels-server.pixels.xyz/matchmake/joinById/${land.roomId}/${land.server}`, {
            method: 'POST',
            body: JSON.stringify(
                {
                    "mapId": 'pixelsNFTFarm-' + landNum,
                    "token": "iamguest",
                    "isGuest": true,
                    "cryptoWallet": {},
                    "username": "Guest-the-traveling-tourist",
                    "world": 99,
                    "ver": 6.91,
                    "avatar": "{}"
                }
            ),
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'
            }
        });
        return await response.json();
    }

    // function getWs(session, resolve, reject) {
    //     const wsUrl = `wss://pixels-server.pixels.xyz/${session.room.processId}/${session.room.roomId}?sessionId=${session.sessionId}`;
    //     const ws = new WebSocket(wsUrl);
    //     ws.binaryType = "arraybuffer";

    //     ws.on('open', () => {
    //         console.log('WebSocket connection established.');
    //         ws.send(new Uint8Array([10]).buffer);
    //     });

    //     ws.on('error', (error) => {
    //         console.error('WebSocket error:', error);
    //         ws.close();
    //         reject(error);
    //     });

    //     ws.on('close', () => {
    //         console.log('WebSocket closed.');
    //         resolve();
    //     });

    //     ws.on('message', (data) => handleWebSocketMessage(data, ws, resolve));  
    // }
    function getWs(session) {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://pixels-server.pixels.xyz/${session.room.processId}/${session.room.roomId}?sessionId=${session.sessionId}`;
            const ws = new WebSocket(wsUrl);
            ws.binaryType = "arraybuffer";

            ws.on('open', () => {
                console.log('WebSocket connection established.');
                ws.send(new Uint8Array([10]).buffer);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                ws.close();
                reject(error);
            });

            ws.on('close', () => {
                console.log('WebSocket closed.');
            });

            ws.on('message', (data) => {
                handleWebSocketMessage(data, ws, resolve);
            });
        });
    }

    function handleWebSocketMessage(data, ws, resolve) {
        const uint8Array = new Uint8Array(data);
        const jsonString = new TextDecoder().decode(uint8Array);
        let finishTimes = processFinishTime(jsonString);
        if (finishTimes) {
            resolve(finishTimes);
            ws.close();
        }
    }
    function pLand(treeDensity) {
        const url = 'https://web-supergraph.lootrush.com/graphql';

        const headers = {
            'Host': 'web-supergraph.lootrush.com',
            'Cookie': 'cf_clearance=zqDUBa37.XCvx2tF9ppjeLUkTog0t4DGxyKgUGopd60-1715918699-1.0.1.1-hhHeFzZNgwFL_V95asZjIuPulhNtgt4TeESnCRlh1kN9gE6rzxb0PhsjUcqMhBvDsbyWtukmfeEswApuSjGHXg',
            'Content-Length': '803',
            'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Sec-Ch-Ua-Mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Sec-Ch-Ua-Platform': '"Linux"',
            'Origin': 'https://www.lootrush.com',
            'Sec-Fetch-Site': 'same-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://www.lootrush.com/',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Priority': 'u=1, i'
        };

        const body = {
            operationName: "nftsV2",
            variables: {
                gameSlug: "pixels---farm-land807754",
                langIsoCode: "en-US",
                pageSize: 20,
                currentPage: 1,
                filterBy: {
                    limitRange: {},
                    rentalFeeRange: {},
                    metadata: [
                        { name: "treeDensity", values: [treeDensity] },
                        { name: "windmill", values: ["Yes"] },
                        { name: "size", values: ["Large"] },
                    ]
                },
                searchBy: "*",
                orderBy: "LOWER_RENTAL_FEE"
            },
            query: `query nftsV2($gameSlug: String!, $langIsoCode: String!, $orderBy: NftSortBy!, $pageSize: Int, $currentPage: Int, $searchBy: String, $filterBy: NftFilters) {
    queryNfts(
      gameSlug: $gameSlug
      langIsoCode: $langIsoCode
      orderBy: $orderBy
      pageSize: $pageSize
      currentPage: $currentPage
      searchBy: $searchBy
      filterBy: $filterBy
    ) {
      nodes {
        name
        pricing {
          dailyFee {
            amount
          }
        }
      }
    }
  }`
        };

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .then(data => {
                if (data.data.queryNfts.nodes) {
                    let array = data.data.queryNfts.nodes
                    let output = [];
                    let warning = false;
                    let target = null;
                    for (let i = 0; i < array.length; i++) {
                        let name = array[i].name;
                        let pricing = array[i].pricing.dailyFee.amount/10000
                        if (treeDensity == "Light" && pricing <= 8|| treeDensity == "Dense" && pricing <= 9.8) {
                            warning = true;
                            target = extractLand(name + ' ' + pricing); 
                            break;
                        }
                        output.push(name + ' ' + pricing)
                    }
                    if (obj && warning) {
                        obj.msg = treeDensity + ':\n' + target.landNum + ' ' + target.price;
                        sysMethod.push(obj)
                    }
                    s.reply(treeDensity + '\nResponse:' + output.join('\n'));
                    
                    //console.log(treeDensity + '\nResponse:'+output.join('\n'));
                }
                else {
                    console.log(treeDensity + 'Response format error' );
                    if (obj) {
                        obj.msg = `${treeDensity} + 'Response format error'`;
                        sysMethod.push(obj)
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    function extractLand(target) {
        const regex = /Farm Land #(\d+)\s+(\d+)/;
        const match = target.match(regex);

        if (match) {
            const landNum = parseInt(match[1], 10);  // 土地编号
            const price = parseFloat(match[2]);    // 价格
            return { landNum, price };
        } else {
            console.error('Format error', target);
            return null;
        }
    }
}