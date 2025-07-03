import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { readJSONfile, writeJSONfile, getJSON } from './db.js';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export function startBot() {
  // bot.onText(/\/start/, async (msg, match) => {
  //   let chatId = msg.chat.id;
  //   let resp = `✨✨歡迎使用 周星星五金電器鋪查詢系統，點擊以下快捷指令快速獲得本店資訊。\n 🌈 /search 如何搜尋商品 \n 🌈 /questionhelp 店鋪Q&A\n 🌈 /shop 全部店鋪 \n 🌈 /news 最新推介產品`
  //   bot.sendMessage(chatId, resp);
  // })



  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log('收到 /start，chatId:', chatId);
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📍商品', callback_data: 'button1' },
            { text: '⏰問答', callback_data: 'button2' },
            { text: '🌟附近', callback_data: 'button3' },
            { text: '💖推介', callback_data: 'button4' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, '✨✨歡迎使用 周星星五金電器鋪查詢系統，點擊以下快捷指令快速獲得本店資訊', opts)
      .then(() => console.log('內聯鍵盤已發送'))
      .catch((err) => console.error('發送內聯鍵盤失敗：', err));
  });

  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    if (data === 'button1') {
      bot.sendMessage(chatId, TIPS_MESSAGE);
    } else if (data === 'button2') {
      bot.sendMessage(chatId, '😇提示：可輸入/question (問題),如/question 時間 即可獲得相關QA回答');
    } else if (data === 'button3') {
      const opts = {
        reply_markup: {
          keyboard: [[{ text: '📍分享我的位置', request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      bot.sendMessage(chatId, '請點擊下方按鈕分享你的位置，以查找附近商戶：', opts)
        .then(() => console.log('位置請求按鈕已發送'))
        .catch((err) => console.error('發送位置請求失敗：', err));

    } else if (data === 'button4') {
      let resp = `🌟✨ 周星星五金 十周年店慶大放送！✨🌟\n
💖 獨家優惠：全線正價貨品 9 折！\n
📍 優惠適用於所有分店或手機落單\n
💸 付款方式：PayMe 即享折扣\n
⏰ 優惠日期：2025年7月1日 - 8月1日（營業時間內）\n
🎉 快來選購，與我們共慶十周年！🎉\n
❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️\n`
      bot.sendMessage(chatId, resp);
    }
    bot.answerCallbackQuery(query.id);
  });

  bot.on('polling_error', (err) => {
    console.error('Polling 錯誤：', err);
  });

  function havesineDistance(coords1, coords2, isMiles = false) {
    const toRad = x => x * Math.PI / 180;

    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;

    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = R * c;

    if (isMiles) {
      distance /= 1.60934;
    }
    return distance;
  }


  bot.on('location', async (msg) => {//for mobile location
    try {
      let fromId = msg.from.id;
      let resp = "";
      const coords1 = {
        latitude: msg.location.latitude,
        longitude: msg.location.longitude
      };
      console.log(coords1.latitude, coords1.longitude)
      let coords2 = { latitude: 34.522, longitude: -118.2437 };
      let shopJSON = await getJSON('http://localhost:8080/shop');

      let result = shopJSON.data.filter((shop) => {
        coords2 = { latitude: shop.latitude, longitude: shop.longitude };
        //console.log(havesineDistance(coords1, coords2));
        return havesineDistance(coords1, coords2) <= 4;//<=2 km
      })

      if (result.length > 0){
         bot.sendMessage(fromId, "以下為指定地點附近的店鋪：(<=2KM)");
          printoutShop(result, bot, fromId, resp);
      }
       
      else
        bot.sendMessage(fromId, "你的附近兩公里内沒有我們的店鋪。");

    } catch (error) {
      console.log(error)
    }
  });

  const TIPS_MESSAGE = "😇提示：查詢物品格式為\n輸入/search <物品名稱> [最低價] [最高價]\n如/search makita 800 2000";

  const sendTips = (bot, chatId, extraMessage = "") => {
    bot.sendMessage(chatId, `${extraMessage ? `\n 結果: ${extraMessage}\n` : ""}${TIPS_MESSAGE}`);
  };

  function printout(court, bot, fromId, resp) {
    court.forEach(async item => {
      resp += `📍名稱: <b>${item.name}\n`;
      resp += `🌟型號: ${item.model}\n`;
      resp += `🎉價格: HKD ${item.price_hkd}\n`;
      resp += `💸${item.description}\n`;
      resp += `✨類型 : ${item.category_type}\n`;
      //console.log(resp);
      bot.sendMessage(fromId, resp);
      resp = "";
    });
  }

  function printoutShop(court, bot, fromId, resp) {
   
    court.forEach(async item => {
      resp += `📍店鋪: ${item.name}\n`;
      resp += `🌟地址: ${item.address}\n`;
      resp += `🎉電話: ${item.phone}\n`;
      resp += `✨時間: ${item.opening_hours}\n`;
      bot.sendMessage(fromId, resp);
      resp = "";
    });
  }

  bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1]?.trim();

    if (!input) {
      return sendTips(bot, chatId, "🙅‍♀️請輸入物品名稱");
    }
    // const aaa = ["1","2","33"]
    const [keyword, minPriceStr, maxPriceStr] = input.split(/\s+/);
    // console.log("---->",minPriceStr,maxPriceStr)
    if (minPriceStr || maxPriceStr) {
      const minPrice = parseInt(minPriceStr, 10);
      const maxPrice = parseInt(maxPriceStr, 10);
      
      if (Number.isNaN(minPrice) || minPrice < 0) {
        return sendTips(bot, chatId, "🙅‍♀️最低價必須為正整數");
      }
      if (Number.isNaN(maxPrice) || maxPrice < 0) {
        return sendTips(bot, chatId, "🙅‍♀️最高價必須為正整數");
      }
      if (maxPrice < minPrice) {
        return sendTips(bot, chatId, "🙅‍♀️最高價不能小於最低價");
      }

      try {
        let resp = "";
        let input = keyword.replace(/\s+/, "").toLowerCase();
        let productJSON = await getJSON("http://localhost:8080/productAll");
        let result = productJSON.data.filter((data) => {
          return (data.name.replace(/\s+/, "").toLowerCase().indexOf(input) != -1) && (data.price_hkd >= minPrice && data.price_hkd <= maxPrice);
        })
        if (result.length > 0) {
          printout(result, bot, chatId, resp);
          return;
        }
        else
          return sendTips(bot, chatId, "🙅‍♀️找不到相關資料.");


      } catch (error) {
        console.log("search worong->", error)
      }
    }
    else if (!minPriceStr && !maxPriceStr) {//just name
      try {
        let resp = "";
        let input = keyword.replace(/\s+/, "").toLowerCase();
        let productJSON = await getJSON("http://localhost:8080/productAll");
        let result = productJSON.data.filter((data) => {
          return data.name.replace(/\s+/, "").toLowerCase().indexOf(input) != -1;
        })

        if (result.length > 0) {
          printout(result, bot, chatId, resp);
          return;
        }
        else
          return sendTips(bot, chatId, "🙅‍♀️找不到相關資料.");


      } catch (error) {
        console.log("search worong->", error)
      }
    }

  });


  // bot.onText(/\/search/, async (msg, match) => {
  //   const chatId = msg.chat.id;
  //   const string = msg.text;
  //   const array = string.split(' ');
  //   let goto = 0;
  //   if (array.length - 1 == 3) {
  //     if (parseInt(array[2]) > 0 && parseInt(array[3]) > 0 && parseInt(array[2]) <= parseInt(array[3])) {
  //       goto = 3;
  //       bot.sendMessage(chatId, `查詢keyword:=${array[1]}, 最低價=${array[2]}, 最高價=${array[3]}`);
  //     }
  //     else
  //       bot.sendMessage(msg.chat.id, "tips:查詢物品格式為\n輸入/search (物品名稱) (最低價*如需要) (最高價*如需要) 例/search makita 800 2000")
  //   } else if (array.length - 1 == 2) {
  //     if (parseInt(array[2]) > 0) {
  //       goto = 2;
  //       bot.sendMessage(chatId, `查詢keyword:=${array[1]}, 最低價=${array[2]}`);
  //     } else
  //       bot.sendMessage(msg.chat.id, "tips:查詢物品格式為\n輸入/search (物品名稱) (最低價*如需要) (最高價*如需要) 例/search makita 800 2000")
  //   } else if (array.length - 1 == 1) {
  //     goto = 1;
  //     bot.sendMessage(chatId, `查詢keyword:=${array[1]}}`);
  //   }
  //   else {
  //     bot.sendMessage(msg.chat.id, "tips:查詢物品格式為\n輸入/search (物品名稱) (最低價*如需要) (最高價*如需要) 例/search makita 800 2000")
  //   }
  //   if (goto) {
  //     try {
  //       let resp = "";
  //       let input = array[1].replace(/\s+/, "").toLowerCase();//del space
  //       let courtJSON = await getJSON("http://localhost:8080/product");
  //       let result = courtJSON.data.filter((court) => {
  //         return court.name.replace(/\s+/, "").toLowerCase().indexOf(input) != -1;

  //       })
  //       //console.log(result);
  //       printout(result, bot, fromId, resp);

  //     } catch (error) {
  //       console.log("search worong->", error)
  //     }
  //   }
  // });


  // bot.onText(/\/search (.+) (.+) (.+)/, async (msg, match) => {
  //   const chatId = msg.chat.id;
  //   const itemName = match[1];
  //   const minPrize = match[2];
  //   const maxPrize = match[3];
  //   console.log(itemName,minPrize,maxPrize);
  //       ////
  // });

  // bot.onText(/\/addproduct (.+) (.+)/, async (msg, match) => {
  //   const chatId = msg.chat.id;
  //   const userId = match[1];
  //   const name = match[2];
  //    ////
  // });

  console.log('Telegram Bot is running');
}