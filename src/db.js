import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from "bcrypt";

dotenv.config();

// 初始化 MongoDB 連接
async function connectDB() {
    try {
        await mongoose.connect(`mongodb://localhost:27017/${process.env.DATABASE_NAME}`, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // 設置連接超時
        });
        console.log('數據庫: MongoDB 運行中');
    } catch (error) {
        console.error('數據庫: MongoDB 運行失敗:', error);
        throw error;
    }
}

// 定義 schemas
const schemas = {
    product: new mongoose.Schema({
        timestamp: Number,
        name: String,
        brand: String,
        model: String,
        description: String,
        price_hkd: Number,
        category_type: Number,
        hot: Number
    }),
    shop: new mongoose.Schema({
        timestamp: Number,
        name: String,
        region: String,
        district: String,
        address: String,
        latitude: Number,
        longitude: Number,
        phone: String,
        opening_hours: String
    }),
    question: new mongoose.Schema({
        timestamp: Number,
        question: String,
        answer: String
    }),
    login: new mongoose.Schema({
        timestamp: Number,
        password: String,
        username: String
    }),
};

// 驗證賬號密碼
async function checkAdminNameAndPassword(username, password) {
    if (!username || !password) {
        console.log("沒有輸入賬號或密碼")
        return {};
    }

    const User = mongoose.model('login', schemas['login'], 'login');
    try {
        const users = await User.find();
        const user = users.find(u => u.username === username);
        if (user && bcrypt.compareSync(password, user.password)) {
            return { id: user.id, username: user.username };
        }
        return {};
    } catch (error) {
        console.error('查詢錯誤:', error);
        return {};
    }
}

// 討論增加的一個遞加的功能
async function incrementHot(DB_id) {
    const User = mongoose.model('product', schemas['product'], 'product');
    try {
        await User.findByIdAndUpdate(
            DB_id,
            { $inc: { hot: 1 } }, // $inc 遞增 hot
            { new: true }
        )
    } catch (error) {
        console.error('自增加失敗:', error);
    }
}

async function createOBJToDB(obj, collectionName) {
    if (!schemas[collectionName]) {
        console.log("createOBJToDB: schemas不存在");
        return false;
    }

    try {
        const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        Object.assign(obj,{"timestamp" : Date.now()});
        await User.create(obj);
        console.log('加入對象完畢',obj);
        return true;
    } catch (error) {
        console.error('加入對象錯誤:', error);
        return false;
    }
}

async function updateOBJToDB(id, obj, collectionName) {
    if (!schemas[collectionName]) {
        console.log("updateOBJToDB: schemas不存在");
        return false;
    }

    try {
        const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        Object.assign(obj,{"timestamp":Date.now()});
        const result = await User.findByIdAndUpdate(id, obj);
        if (!result || result == null) {
            console.log('修改對象不存在或錯誤', result);
            return false;
        }
        else {
            console.log('修改對象完畢', result);
            return true;
        }
    } catch (error) {
        console.error('修改對象錯誤:', error);
        return false;
    }
}

async function delelteOBJToDB(id, collectionName) {
    if (!schemas[collectionName]) {
        console.log("delelteOBJToDB: schemas不存在");
        return false;
    }

    try {
        const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        const result = await User.findByIdAndDelete(id);
        if (!result || result == null) {
            console.log('刪除對象不存在或錯誤', result);
            return false;
        }
        else {
            console.log('刪除對象完畢', result);
            return true;
        }

    } catch (error) {
        console.error('刪除對象錯誤:', error);
        return false;
    }
}
//20250713 建立模型緩存 解決mongoose.model(collectionName, schema)，Mongoose 會拋出 OverwriteModelError 問題
// const models = {};

// function getModel(collectionName) {
//     if (!schemas[collectionName]) {
//         throw new Error(`Invalid collection name: ${collectionName}`);
//     }
//      if (!models[collectionName]) {
//     models[collectionName] = mongoose.model(collectionName, schemas[collectionName], collectionName);
//      }
//     return models[collectionName];
// }

async function readJsonFromMongo(collectionName) {
    try {
     if (!schemas[collectionName]) {
        throw new Error(`錯誤的collectionName: ${collectionName}`);
     }       
        // const Model = getModel(collectionName);
        const Model = mongoose.model(collectionName, schemas[collectionName], collectionName)
        const data = await Model.find().lean();
        return JSON.stringify(data);
    } catch (error) {
        console.error('readJsonFromMongo錯誤:', error);
        throw new Error(error.message);
    }
}

//20250709 初始化已棄用，
// async function importJsonToMongo() {
//   try {
//     const productData = await fs.readFile('src/product.json', 'utf8');
//     await mongoose.model('product', schemas["product"]).insertMany(JSON.parse(productData));

//     const shopData = await fs.readFile('src/shop.json', 'utf8');
//     await mongoose.model('shop', schemas["shop"]).insertMany(JSON.parse(shopData));

//     const questionData = await fs.readFile('src/question.json', 'utf8');
//     await mongoose.model('question', schemas["question"]).insertMany(JSON.parse(questionData));
//   } catch (error) {
//     console.error("to mongo wrong", error);
//   }
// }

export { readJsonFromMongo, checkAdminNameAndPassword, createOBJToDB, updateOBJToDB, delelteOBJToDB, connectDB, incrementHot };