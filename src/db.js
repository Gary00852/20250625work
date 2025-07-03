import { promises as fs } from "fs"
// import { fileURLToPath } from 'url';
// import { dirname, resolve } from 'path';
import axios from "axios";

async function readJSONfile(datapath) {
    return await fs.readFile(datapath, "utf8");
}

async function writeJSONfile(datapath, data) {
    return await fs.writeFile(datapath, data);
}

async function getJSON(url) {
    return await axios.get(url);
}

export { readJSONfile, writeJSONfile, getJSON };















// import { MongoClient } from 'mongodb';
// import dotenv from 'dotenv';

// dotenv.config();

// const url = process.env.MONGODB_URL;
// const dbName = process.env.DB_NAME;
// let db;

// export async function connectDB() {
//   try {
//     const client = await MongoClient.connect(url, { useUnifiedTopology: true });
//     db = client.db(dbName);
//     console.log('Connected to MongoDB');
//   } catch (err) {
//     console.error('MongoDB connection error:', err);
//     throw err;
//   }
// }

// export async function getUser(userId) {
//   return await db.collection('users').findOne({ id: userId });
// }

// export async function addUser(user) {
//   return await db.collection('users').insertOne(user);
// }