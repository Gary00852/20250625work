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
        return { success: false, message: "沒有輸入賬號或密碼" };
    }

    //const User = mongoose.model('login', schemas['login'], 'login');
    const User = getModel('login');
    try {
        const user = await User.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            return { success: true, message: "賬戶密碼驗證成功", id: user.id, username: user.username };
        }
        return { success: false, message: "驗證失敗，請檢查賬號密碼" };
    } catch (error) {
        console.error('驗證賬戶系統有誤:', error);
        return { success: false, message: "驗證賬戶系統有誤" };
    }
}

// 20250719 以下更新為類json錯誤傳送方式
async function insertIntoMongo(obj, collectionName) {
    if (!schemas[collectionName]) {
        //throw new Error(`錯誤的collectionName: ${collectionName}`);
        return { success: false, message: "schemas不存在,加入失敗" };
    }

    try {
        //const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        const User = getModel(collectionName);
        const newObj = { ...obj, "timestamp": Date.now() };
        await User.create(newObj);
        return { success: true, message: "加入對象成功", data: newObj };
    } catch (error) {
        console.error('加入對象錯誤:', error);
        return { success: false, message: "加入對象失敗" };;
    }
}

async function updateInMongo(id, obj, collectionName) {
    if (!schemas[collectionName]) {
        return { success: false, message: "schemas不存在,修改失敗" };
    }

    try {
        //const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        const User = getModel(collectionName);
        const newObj = { ...obj, "timestamp": Date.now() };
        const result = await User.findByIdAndUpdate(id, newObj);
        if (!result || result == null) {
            return { success: false, message: "修改對象不存在或錯誤" };
        } 
        else {
           // console.log('修改對象完畢', result);
            return { success: true, message: "修改成功", data: result };
        }
    } catch (error) {
        console.error('修改對象錯誤:', error);
        return { success: false, message: "修改對象失敗" };;
    }
}

async function deleteFromMongo(id, collectionName) {
    if (!schemas[collectionName]) {
        return { success: false, message: "schemas不存在,刪除失敗" };
    }

    try {
        //const User = mongoose.model(collectionName, schemas[collectionName], collectionName);
        const User = getModel(collectionName);
        const result = await User.findByIdAndDelete(id);
        if (!result || result == null) {
            return { success: false, message: "此_id對象不存在" };
        }
        else {
            return { success: true, message: "刪除對象成功", data: result };
        }

    } catch (error) {
        console.error('刪除對象失敗:', error);
        return { success: false, message: "刪除對象失敗" };
    }
}

async function findInMongo(collectionName) {
    try {
        if (!schemas[collectionName]) {
            return { success: false, message: "schemas不存在,查找失敗" };
        }
        const Model = getModel(collectionName);
        //const Model = mongoose.model(collectionName, schemas[collectionName], collectionName)
        const data = await Model.find().lean();
        return JSON.stringify(data);
    } catch (error) {
        console.error('findInMongo錯誤:', error);
        return { success: false, message: "查找對象失敗" };
    }
}

//模型緩存邏輯，避免重複定義模型
const models = {};
function getModel(collectionName) {
    if (!models[collectionName]) {
        models[collectionName] = mongoose.model(collectionName, schemas[collectionName], collectionName);
    }
    return models[collectionName];
}

export { checkAdminNameAndPassword, connectDB, findInMongo, deleteFromMongo, updateInMongo, insertIntoMongo,getModel };