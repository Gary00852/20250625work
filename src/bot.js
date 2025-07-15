import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import axios from "axios";
import { incrementHot } from './db.js';

dotenv.config();
//常數位置
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const TIPS_SEARCH = "😇提示：查詢物品格式為\n輸入/search <物品名稱> [最低價] [最高價]\n如/search makita 800 2000";
const TIPS_QUESTIONS = "😇提示：查詢問題格式為\n輸入/question <關鍵字>\n如/question 保養";
const category = ["鑽孔與螺絲固定工具", "切割工具", "表面處理工具", "其他專業工具"];
// 記錄用戶某些參數 lastTime最後使用時間 action作爲判斷狀態的flag
const lastInteraction = {};

const welcomeMessage = '✨✨歡迎使用 周星星五金電器鋪查詢系統，點擊以下快捷指令快速獲得本店資訊';
const recallMessage = ' 🤗 有無其它問題可以幫你？';
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🌟商品', callback_data: 'button1' },
        { text: '⏰問答', callback_data: 'button2' },
        { text: '📍附近', callback_data: 'button3' },
        { text: '💖推廣', callback_data: 'button4' },
        { text: '💯熱門', callback_data: 'button5' }

      ]
    ]
  }
};

const sendTips = (bot, chatId, extraMessage = "", TIPS_MESSAGE = "") => {
  bot.sendMessage(chatId, `${extraMessage ? `\n 結果: ${extraMessage}\n` : ""}${TIPS_MESSAGE}`);
};

//函數位置
async function getJSON(url) {
  return await axios.get(url);
}

async function printoutQuestion(court, bot, fromId) {
  for (const item of court) {
    let resp = `📍問題: ${item.question}\n`;
    resp += `🌟答案: ${item.answer}\n`;
    await bot.sendMessage(fromId, resp); // ps:await 順序顯示
  }
}

async function printoutProduct(court, bot, fromId) {
  for (const item of court) {
    incrementHot(item._id)
    let resp = `📍名稱: ${item.name}\n`;
    resp += `🌟型號: ${item.model}\n`;
    resp += `🎉價格: HKD ${item.price_hkd}\n`;
    resp += `💸${item.description}\n`;
    resp += `✨類型 : ${category[item.category_type - 1]}\n`;
    await bot.sendMessage(fromId, resp); // ps:await 順序顯示
  }
}

async function showTheLocationMap(chatId, latitude, longitude) {
  try {
    return await bot.sendLocation(chatId, latitude, longitude, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '在 Google 地圖上查看', url: `https://maps.google.com/?q=${latitude},${longitude}` }]
        ]
      }
    });
  } catch (error) {
    console.error('發送位置失敗:', error);
    await bot.sendMessage(chatId, '無法發送位置，請稍後再試。');
    // throw error;
  }
}

async function printoutShop(court, bot, fromId) {
  for (const item of court) {
    let resp = `📍店鋪: ${item.name}\n`;
    resp += `🌟地址: ${item.address}\n`;
    resp += `🎉電話: ${item.phone}\n`;
    resp += `✨時間: ${item.opening_hours}\n`;
    await bot.sendMessage(fromId, resp); //ps:await 順序顯示
    resp = "";
    await showTheLocationMap(fromId, item.latitude, item.longitude);
  };
}

//BOT主執行函數
export function startBot() {
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const now = Date.now();
    const userState = lastInteraction[chatId] || { lastTime: 0, action: null };

    // 如果用戶超過 1 小時未互動，重新顯示歡迎消息
    if (msg.text !== undefined && !msg.text.startsWith('/') && now - userState.lastTime > 60 * 1000) {
      bot.sendMessage(chatId, welcomeMessage, mainMenu);
      lastInteraction[chatId] = { lastTime: now, action: null };
    }
    // 檢查用戶是否處於等待輸入商品名稱的狀態
    else if (msg.text !== undefined && !msg.text.startsWith('/') && userState.action === 'awaiting_product_search') {
      // 模擬 /search 命令
      const input = msg.text.trim();
      handleSearchCommand(chatId, input);
      lastInteraction[chatId] = { lastTime: now, action: null }; // reset
    }
    // 檢查用戶是否處於等待輸入問題關鍵詞的狀態
    else if (msg.text !== undefined && !msg.text.startsWith('/') && userState.action === 'awaiting_question_search') {
      const input = msg.text.trim();
      handleQuestionCommand(chatId, input);
      lastInteraction[chatId] = { lastTime: now, action: null }; // reset
    }
    else if (msg.text !== undefined && !msg.text.startsWith('/')) {
      bot.sendMessage(chatId, '💖你好, 是否需要以下服務？', mainMenu);
      lastInteraction[chatId] = { lastTime: now, action: null };
    }
    lastInteraction[chatId] = lastInteraction[chatId] || { lastTime: now, action: null };
    lastInteraction[chatId].lastTime = now;
  });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    lastInteraction[chatId] = { lastTime: Date.now(), action: null };
    bot.sendMessage(chatId, welcomeMessage, mainMenu);
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    if (data === 'button1') {
      // 提示用戶輸入商品名稱或關鍵詞
      await bot.sendMessage(chatId, '⌨ 請輸入 <u> 商品名稱 </u>(可連價格區間) (如: makita / makita 800 2000)', { parse_mode: 'HTML' });
      lastInteraction[chatId] = { lastTime: Date.now(), action: 'awaiting_product_search' };
    } else if (data === 'button2') {
      // 提示用戶輸入問題關鍵詞
      await bot.sendMessage(chatId, '⌨ 請輸入你的問題 <u> 關鍵詞 </u>（如：保養）：', { parse_mode: 'HTML' });
      lastInteraction[chatId] = { lastTime: Date.now(), action: 'awaiting_question_search' };
    } else if (data === 'button3') {
      const opts = {
        reply_markup: {
          keyboard: [[{ text: '📍分享我的位置', request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      };
      await bot.sendMessage(chatId, '請點擊下方按鈕分享你的位置, 以查找附近2km内的商戶: ', opts)
        .catch((err) => console.error('發送位置請求失敗：', err));
    } else if (data === 'button4') {
      let resp = `🌟✨ 周星星五金 十周年店慶大放送！✨🌟\n
💖 獨家優惠：全線正價貨品 9 折！\n
📍 優惠適用於所有分店或手機落單\n
💸 付款方式：PayMe 即享折扣\n
⏰ 優惠日期：2025年7月1日 - 8月1日（營業時間內）\n
🎉 快來選購，與我們共慶十周年！🎉\n
❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️\n`;
      await bot.sendMessage(chatId, resp);
      await bot.sendMessage(chatId, recallMessage, mainMenu);
    } else if (data === 'button5') {
      const top5Json = await getJSON(`http://localhost:${process.env.SERVER_PORT}/top5Product`);
      let resp = `🌟✨ 周星星至hot產品介紹! ✨🌟\n(根據搜索次數由多至少排序)\n
👍no1: ${top5Json.data[0].name}\n搜尋次數: ${top5Json.data[0].hot}\n
👍no2: ${top5Json.data[1].name}\n搜尋次數: ${top5Json.data[1].hot}\n
👍no3: ${top5Json.data[2].name}\n搜尋次數: ${top5Json.data[2].hot}\n
👍no4: ${top5Json.data[3].name}\n搜尋次數: ${top5Json.data[3].hot}\n
👍no5: ${top5Json.data[4].name}\n搜尋次數: ${top5Json.data[4].hot}\n
\n`;
      await bot.sendMessage(chatId, resp);
      await bot.sendMessage(chatId, recallMessage, mainMenu);
    }
    //呢個係確認已收取的callback
    await bot.answerCallbackQuery(query.id);
  });

  bot.on('polling_error', (err) => {
    console.error('Polling 錯誤：', err);
  });

  bot.on('location', async (msg) => {
    const fromId = msg.from.id;
    try {
      const locationJson = await getJSON(`http://localhost:${process.env.SERVER_PORT}/location/${msg.location.latitude}/${msg.location.longitude}`);
      if (locationJson.data.length > 0) {
        await bot.sendMessage(fromId, "以下為指定地點附近的店鋪：(<=2KM)");
        await printoutShop(locationJson.data, bot, fromId);
      } else {
        await bot.sendMessage(fromId, "你的附近兩公里内沒有我們的店鋪。");
      }
    } catch (error) {
      console.error("Location handler error:", error);
      await bot.sendMessage(fromId, "處理位置時發生錯誤，請稍後再試。");
    }
    await bot.sendMessage(fromId, recallMessage, mainMenu);
  });

  async function handleQuestionCommand(chatId, input) {
    try {
      if (!input) {
        await sendTips(bot, chatId, "🙅‍♀️請輸入問題關鍵詞", TIPS_QUESTIONS);
      } else {
        let fixinput = input.replace(/\s+/, "").toLowerCase();
        let questionJSON = await getJSON(`http://localhost:${process.env.SERVER_PORT}/question/${fixinput}`);
        if (questionJSON.data.length > 0) {
          await printoutQuestion(questionJSON.data, bot, chatId);
        } else {
          await sendTips(bot, chatId, "🙅‍♀️找不到相關問題資料", TIPS_QUESTIONS);
        }
      }
    } catch (error) {
      console.error("handleQuestionCommand: ", error);
      await sendTips(bot, chatId, "🙅‍♀️發生錯誤，請稍後再試", TIPS_QUESTIONS);
    }finally{
      await bot.sendMessage(chatId, recallMessage, mainMenu);
    }
    
  }

  bot.onText(/\/question(?:\s+(\S+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1]?.trim();
    handleQuestionCommand(chatId, input);
  });

  async function handleSearchCommand(chatId, input) {
    try {
      if (!input) {
        await sendTips(bot, chatId, "🙅‍♀️請輸入物品名稱", TIPS_SEARCH);
      } else {
        const [keyword, minPriceStr, maxPriceStr] = input.split(/\s+/);
        if (minPriceStr || maxPriceStr) {
          const minPrice = parseInt(minPriceStr, 10);
          const maxPrice = parseInt(maxPriceStr, 10);
          if (Number.isNaN(minPrice) || Number.isNaN(maxPrice))
            await sendTips(bot, chatId, "🙅‍♀️請正確輸入 最低價 和 最高價", TIPS_SEARCH);
          else if (maxPrice < minPrice)
            await sendTips(bot, chatId, "🙅‍♀️最高價不能小於最低價", TIPS_SEARCH);
          else {
            const searchJson = await getJSON(`http://localhost:${process.env.SERVER_PORT}/search/${keyword}/${minPriceStr}/${maxPriceStr}`);
            if (searchJson.data.length > 0) {
              await printoutProduct(searchJson.data, bot, chatId);
            } else {
              await sendTips(bot, chatId, "🙅‍♀️找不到相關資料", TIPS_SEARCH);
            }
          }
        } else {
          const searchJson = await getJSON(`http://localhost:${process.env.SERVER_PORT}/search/${keyword}`);
          if (searchJson.data.length > 0) {
            await printoutProduct(searchJson.data, bot, chatId);
          } else {
            await sendTips(bot, chatId, "🙅‍♀️找不到相關資料", TIPS_SEARCH);
          }
        }
      }
    } catch (error) {
      console.log("handleSearchCommand:", error);
      await sendTips(bot, chatId, "🙅‍♀️發生錯誤，請稍後再試", TIPS_SEARCH);
    }finally{
    await bot.sendMessage(chatId, recallMessage, mainMenu);
    }
  }

  //用戶也可直接執行/search 指令操作，用作交功課完整功能（如需要）
  bot.onText(/\/search(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1]?.trim();
    handleSearchCommand(chatId, input);
  });

  console.log('Telegram Bot is running');
}