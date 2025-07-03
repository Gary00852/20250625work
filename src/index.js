import express from 'express';
import apiRoutes from './api.js';
//import { connectDB } from './db.js';
import { startBot } from './bot.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/', apiRoutes);

const port = process.env.SERVER_PORT || 8080;

async function startApp() {
  try {
    //await connectDB();
    startBot();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start app:', err);
  }
}

startApp();

















// project/
// ├── src/
// │   ├── bot.js          # Telegram Bot 邏輯
// │   ├── api.js          # RESTful API 路由
// │   ├── db.js           # MongoDB 連線和操作
// │   └── index.js        # 入口檔案
// ├── package.json
// └── .env                # 環境變數