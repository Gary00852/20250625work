import express from 'express';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { checkAdminNameAndPassword, findInMongo, insertIntoMongo, updateInMongo, deleteFromMongo, getModel } from './db.js';
import Joi from "joi";

dotenv.config();

const router = express.Router();

router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 401 && 'body' in err) {
        return res.status(401).json({ error: '錯誤的JSON輸入' });
    }
    next(err);
})

//20250710 LOUIS：改爲使用數據庫存儲，跳轉到db.js進行驗證，回傳obj為空時密碼錯誤或不存在
const authenticate = async (req, res, next) => {
    const { username, password } = req.body;
    const resultObj = await checkAdminNameAndPassword(username, password);
    if (resultObj.success) {
        req.user = { "id": resultObj.id, "username": resultObj.username };
        next();
    }
    else {
        res.status(401).json({ error: "賬號或密碼錯誤" });
    }
}

//20250710 LOUIS：authorize 邏輯維持不變
const authorize = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;// Bearer + authorizationtoken
        if (authHeader === undefined || authHeader === null) {
            return res.status(401).json({ error: '缺失授權頭' });
        }
        const token = authHeader.split(" ")[1];
        if (token == null)
            return res.status(401).json({ error: '無效的令牌格式' });

        jwt.verify(token, process.env.JWT_SECRET, (err, userobj) => {
            if (err) {
                return res.status(403).json({ error: '令牌驗證失敗' });
            }
            req.user = userobj;
            next();
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: '服務器錯誤' });
    }
}

// 20250712 LOUIS：增加Joi進行初步驗證資料和類型是否正確
const productSchema = Joi.object({
    name: Joi.string().required(),
    brand: Joi.string().required(),
    model: Joi.string().required(),
    description: Joi.string().required(),
    price_hkd: Joi.number().min(0).required(),
    category_type: Joi.number().integer().min(1).max(4).required(),
    hot: Joi.number().required()
})

const shopSchema = Joi.object({
    name: Joi.string().required(),
    region: Joi.string().required(),
    district: Joi.string().required(),
    address: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    phone: Joi.string().required(),
    opening_hours: Joi.string().required()
})

const questionSchema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
})

//function add by sir
export function havesineDistance(coords1, coords2, isMiles = false) {
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


//-------------------------Product-------------------------//
// 20250712 product CRUD ( post / get / put / delete )

// Product create 
router.post("/product", authorize, async (req, res) => {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const resultObj = await insertIntoMongo(req.body, 'product');
        if (resultObj.success) {
            res.status(201).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "增加商品錯誤" });
    }
})

// Product Read
router.get("/product", async (req, res) => {
    try {
        const readfile = await findInMongo("product");
        res.end(readfile);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "讀取商品錯誤" });
    }
})

// Product Update (id使用db默認生成的_id)
router.put("/product/:pid", authorize, async (req, res) => {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const resultObj = await updateInMongo(req.params.pid, req.body, 'product');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "更新商品錯誤" });
    }
})

// Product Delete (id使用db默認生成的_id)
router.delete("/product/:pid", authorize, async (req, res) => {
    try {
        const resultObj = await deleteFromMongo(req.params.pid, 'product');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "刪除問題錯誤" });
    }
})

//-------------------------Shop-------------------------//
// 20250712 shop CRUD ( post / get / put / delete )
// Shop create 
router.post("/shop", authorize, async (req, res) => {
    try {
        const { error } = shopSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const resultObj = await insertIntoMongo(req.body, 'shop');
        if (resultObj.success) {
            res.status(201).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "增加商店錯誤" });
    }
})

// Shop Read
router.get("/shop", async (req, res) => {
    try {
        const readfile = await findInMongo("shop");
        res.end(readfile);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "讀取商店錯誤" });
    }
})

// Shop Update (id使用db默認生成的_id)
router.put("/shop/:pid", authorize, async (req, res) => {
    try {
        const { error } = shopSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ error: error.details[0].message });
        }
        const resultObj = await updateInMongo(req.params.pid, req.body, 'shop');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "更新商店錯誤" });
    }
})

// Shop Delete (id使用db默認生成的_id)
router.delete("/shop/:pid", authorize, async (req, res) => {
    try {
        const resultObj = await deleteFromMongo(req.params.pid, 'shop');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "刪除問題錯誤" });
    }
})

//-------------------------question-------------------------//
// 20250712 question CRUD ( post / get / put / delete )
// Question create 
router.post("/question", authorize, async (req, res) => {
    try {
        const { error } = questionSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }
        const resultObj = await insertIntoMongo(req.body, 'question');
        if (resultObj.success) {
            res.status(201).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "增加問題錯誤" });
    }
})

// Question Read
router.get("/question", async (req, res) => {
    try {
        const readfile = await findInMongo("question");
        res.end(readfile);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "讀取問題錯誤" });
    }
})

// Question Update (id使用db默認生成的_id)
router.put("/question/:pid", authorize, async (req, res) => {
    try {
        const { error } = questionSchema.validate(req.body);
        if (error) {
            return res.status(401).json({ error: error.details[0].message });
        }
        const resultObj = await updateInMongo(req.params.pid, req.body, 'question');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "更新問題錯誤" });
    }
})

// Question Delete (id使用db默認生成的_id)
router.delete("/question/:pid", authorize, async (req, res) => {
    try {
        const resultObj = await deleteFromMongo(req.params.pid, 'question');
        if (resultObj.success) {
            res.status(200).json({ success: true, message: resultObj.message, data: resultObj.data });
        } else {
            res.status(401).json({ success: false, message: resultObj.message });
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "刪除問題錯誤" });
    }
})

// 以關鍵詞同價格區間查詢
router.get('/search/:param1/:param2/:param3', async (req, res) => {
    try {
        const { param1: keyword, param2: minprice, param3: maxprice } = req.params;
        const minPriceNum = Number(minprice);
        const maxPriceNum = Number(maxprice);

        if (isNaN(minPriceNum) || isNaN(maxPriceNum) || minPriceNum > maxPriceNum || maxPriceNum < 0|| minPriceNum < 0) {
            res.status(401).json({ error: '請輸入正確的最低和最高價格' });
        }
        const Model = getModel('product');
        const result = await Model.find({ name: { $regex: keyword, $options: 'i' }, price_hkd: { $gte: minPriceNum, $lte: maxPriceNum } });

        if (result.length === 0) {
            res.status(401).json({ error: "沒有找到相關資料" });
        }
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: '查詢商品名稱和價格錯誤' });
    }
});

//以關鍵詞查詢商品
router.get('/search/:param1', async (req, res) => {
    try {
        const { param1: keyword } = req.params;
        const Model = getModel('product');
        const result = await Model.find({ name: { $regex: keyword, $options: 'i' } });
        if (result.length === 0) {
            res.status(401).json({ error: "沒有找到相關資料" });
        }
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: '查詢商品名稱錯誤' });
    }
})

//以關鍵詞查詢答案
router.get('/question/:param1', async (req, res) => {
    try {
        const { param1: keyword } = req.params;
        const Model = getModel('question');
        const result = await Model.find({ question: { $regex: keyword, $options: 'i' }});
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: '查詢問題答案錯誤' });
    }
})

// location 20250718 合為中間件
const validateLatLong = (req, res, next) => {
    const { param1, param2 } = req.params;
    const latitude = parseFloat(param1);
    const longitude = parseFloat(param2);

    if (
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(401).json({ error: '輸入的經緯度有誤，緯度應在 -90 ~ 90, 經度應在 -180 ~ 180' });
    }
    req.coords = { latitude, longitude };
    next();
};

//查詢附近商店
router.get('/location/:param1/:param2', validateLatLong, async (req, res) => {
    try {
        const shopString = await findInMongo('shop');
        const shopJSON = JSON.parse(shopString);
        const result = shopJSON.filter((shop) => {
            const coords2 = { latitude: parseFloat(shop.latitude), longitude: parseFloat(shop.longitude) };
            return havesineDistance(req.coords, coords2) <= 2;
        });
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: '獲取附近商店資料錯誤' });
    }
});

//商品前五物品篩選
router.get('/top5Product', async (req, res) => {
    try {
        const productString = await findInMongo("product");
        let productJSON = JSON.parse(productString);
        const top5Product = productJSON.sort((a, b) => b.hot - a.hot).slice(0, 5)
        res.json(top5Product);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: '獲取商品熱度前五數據錯誤' });
    }
})

router.post("/login", authenticate, (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { "expiresIn": "1h" })
    res.json({ token });
})

export default router;//匯出給index.js使用