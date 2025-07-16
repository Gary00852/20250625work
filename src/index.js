import express from 'express';
import apiRoutes from './api.js';
import { connectDB } from './db.js';
import { startBot } from './bot.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use('/', apiRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/admin/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/admin/question', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'question.html'));
});

const port = process.env.SERVER_PORT || 8080;
async function startApp() {
  try {
    await connectDB();
    startBot();
    app.listen(port, () => {
      console.log(`服務器: http://localhost:${port} 運行中`);
    });
  } catch (err) {
    console.error('無法開啓該運用:', err);
  }
}

startApp();