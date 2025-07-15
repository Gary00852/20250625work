import express from 'express';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { readJsonFromMongo, checkAdminNameAndPassword, createOBJToDB, updateOBJToDB, delelteOBJToDB } from './db.js';
import Joi from "joi";

dotenv.config();

const router = express.Router();

router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON input' });
    }
    next(err);
})

//20250710 LOUIS：改爲使用數據庫存儲，跳轉到db.js進行驗證，回傳obj為空時密碼錯誤或不存在
const authenticate = async (req, res, next) => {
    const { username, password } = req.body;
    const loginObj = await checkAdminNameAndPassword(username, password);
    if ("id" in loginObj) {
        req.user = { "id": loginObj.id, "username": loginObj.username };
        next();
    } else {
        res.status(400).json({ "err": "input wrong!! user or password!" });
    }
}

//20250710 LOUIS：authorize 邏輯維持不變
const authorize = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;//the bearer and token
        if (authHeader === undefined || authHeader === null) {
            return res.sendStatus(401);
        }
        const token = authHeader.split(" ")[1];
        if (token == null)
            return res.sendStatus(401);

        jwt.verify(token, process.env.JWT_SECRET, (err, userobj) => {
            if (err)
                return res.sendStatus(403);

            req.user = userobj;
            next();
        })
    } catch (error) {
        console.log(error);
    }
}

// 20250712 增加Joi進行初步驗證資料和類型是否正確
const productSchema = Joi.object({
    no: Joi.number().required(),
    name: Joi.string().required(),
    brand: Joi.string().required(),
    model: Joi.string().required(),
    description: Joi.string().required(),
    price_hkd: Joi.number().min(0).required(),
    category_type: Joi.number().required(),
    hot: Joi.number().required()
})

const shopSchema = Joi.object({
    no: Joi.number().required(),
    name: Joi.string().required(),
    region: Joi.string().required(),
    district: Joi.string().required(),
    address: Joi.string().required(),
    latitude: Joi.number().min(0).required(),
    longitude: Joi.number().required(),
    phone: Joi.string().required(),
    opening_hours: Joi.string().required()
})

const questionSchema = Joi.object({
    no: Joi.number().required(),
    question: Joi.string().required(),
    answer: Joi.string().required(),
})

//function
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



//-------------------------Product-------------------------//
// 20250712 product CRUD ( post / get / put / delete )

// Product create 
router.post("/product", authorize, async (req, res) => {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const addOBj = await createOBJToDB(req.body, 'product');
        if (addOBj) {
            res.status(201).send("增加商品成功");
        }
        else {
            res.status(400).send("增加商品失敗");
        }
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(增加商品)" });
        console.error(error);
    }
})

// Product Read
router.get("/product", async (req, res) => {
    try {
        const readfile = await readJsonFromMongo("product");
        res.end(readfile);
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(讀取商品)" });
        console.error(error);
    }
})

// Product Update (id使用db默認生成的_id)
router.put("/product/:pid", authorize, async (req, res) => {
    try {
        const { error } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const updateOBJ = await updateOBJToDB(req.params.pid, req.body, 'product');
        if (updateOBJ) {
            res.status(201).send("更新商品成功");
        }
        else {
            res.status(400).send("更新商品失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(更新商品)" });
        console.error(error);
    }
})

// Product Delete (id使用db默認生成的_id)
router.delete("/product/:pid", authorize, async (req, res) => {
    try {
        const deleteOBJ = await delelteOBJToDB(req.params.pid, 'product');
        if (deleteOBJ) {
            res.status(201).send("刪除商品成功");
        }
        else {
            res.status(400).send("刪除商品失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(刪除商品)" });
        console.error(error);
    }
})

//-------------------------Shop-------------------------//
// 20250712 shop CRUD ( post / get / put / delete )
// Shop create 
router.post("/shop", authorize, async (req, res) => {
    try {
        const { error } = shopSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const addOBj = await createOBJToDB(req.body, 'shop');
        if (addOBj) {
            res.status(201).send("增加商店成功");
        }
        else {
            res.status(400).send("增加商店失敗");
        }
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(增加商店)" });
        console.error(error);
    }
})

// Shop Read
router.get("/shop", async (req, res) => {
    try {
        const readfile = await readJsonFromMongo("shop");
        res.end(readfile);
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(讀取商店)" });
        console.error(error);
    }
})

// Shop Update (id使用db默認生成的_id)
router.put("/shop/:pid", authorize, async (req, res) => {
    try {
        const { error } = shopSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const updateOBJ = await updateOBJToDB(req.params.pid, req.body, 'shop');
        if (updateOBJ) {
            res.status(201).send("更新商店成功");
        }
        else {
            res.status(400).send("更新商店失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(更新商店)" });
        console.error(error);
    }
})

// Shop Delete (id使用db默認生成的_id)
router.delete("/shop/:pid", authorize, async (req, res) => {
    try {
        const deleteOBJ = await delelteOBJToDB(req.params.pid, 'shop');
        if (deleteOBJ) {
            res.status(201).send("刪除商店成功");
        }
        else {
            res.status(400).send("刪除商店失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(刪除商店)" });
        console.error(error);
    }
})

//-------------------------question-------------------------//
// 20250712 question CRUD ( post / get / put / delete )
// Question create 
router.post("/question", authorize, async (req, res) => {
    try {
        const { error } = questionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const addOBj = await createOBJToDB(req.body, 'question');
        if (addOBj) {
            res.status(201).send("增加問題成功");
        }
        else {
            res.status(400).send("增加問題失敗");
        }
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(增加問題)" });
        console.error(error);
    }
})

// Question Read
router.get("/question", async (req, res) => {
    try {
        const readfile = await readJsonFromMongo("question");
        res.end(readfile);
    } catch (error) {
        res.status(500).json({ "錯誤": "API出錯(讀取問題)" });
        console.error(error);
    }
})

// Question Update (id使用db默認生成的_id)
router.put("/question/:pid", authorize, async (req, res) => {
    try {
        const { error } = questionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const updateOBJ = await updateOBJToDB(req.params.pid, req.body, 'question');
        if (updateOBJ) {
            res.status(201).send("更新問題成功");
        }
        else {
            res.status(400).send("更新問題失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(更新問題)" });
        console.error(error);
    }
})

// Question Delete (id使用db默認生成的_id)
router.delete("/question/:pid", authorize, async (req, res) => {
    try {
        const deleteOBJ = await delelteOBJToDB(req.params.pid, 'question');
        if (deleteOBJ) {
            res.status(201).send("刪除問題成功");
        }
        else {
            res.status(400).send("刪除問題失敗");
        }
    }
    catch (error) {
        res.status(500).json({ "錯誤": "API出錯(刪除問題)" });
        console.error(error);
    }
})

// search name minprice maxprice
router.get('/search/:param1/:param2/:param3', async (req, res) => {
    try {
        const { param1: keyword, param2: minprice, param3: maxprice } = req.params;
        const minPriceNum = Number(minprice);
        const maxPriceNum = Number(maxprice);

        if (isNaN(minPriceNum) || isNaN(maxPriceNum)) {
            res.status(400).json({ error: '錯誤最低或最高價' });
            return [];
        }

        const productString = await readJsonFromMongo("product");
        let productJSON = JSON.parse(productString);
        const result = productJSON.filter((data) => {
            return (
                data.name &&
                data.name.replace(/\s+/g, "").toLowerCase().includes(keyword.toLowerCase()) &&
                data.price_hkd >= minPriceNum &&
                data.price_hkd <= maxPriceNum
            );
        });

        res.json(result);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'search api 錯誤' });
    }
});

//search api only name
router.get('/search/:param1', async (req, res) => {
    try {
        const { param1: keyword } = req.params;
        const productString = await readJsonFromMongo("product");
        let productJSON = JSON.parse(productString);
        const result = productJSON.filter((data) => {
            return (
                data.name &&
                data.name.replace(/\s+/g, "").toLowerCase().includes(keyword.toLowerCase())
            );
        });

        res.json(result);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'search api 錯誤' });
    }
})

//question api only name
router.get('/question/:param1', async (req, res) => {
    try {
        const { param1: keyword } = req.params;
        const questionString = await readJsonFromMongo("question");
        let questionJSON = JSON.parse(questionString);
        const result = questionJSON.filter((data) => {
            return (
                data.question && data.question.replace(/\s+/g, "").toLowerCase().includes(keyword.toLowerCase())
            );
        });

        res.json(result);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'question api 錯誤' });
    }
})

// location
router.get("/location/:param1/:param2", async (req, res) => {
  try {
    const { param1, param2 } = req.params;
    const latitude = parseFloat(param1);
    const longitude = parseFloat(param2);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      !isFinite(latitude) ||
      !isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "輸入的經緯度有誤，緯度應在 -90 ~ 90, 經度應在 -180 ~ 180" });
    }

    const shopString = await readJsonFromMongo("shop");
    let shopJSON = JSON.parse(shopString);

    if (!Array.isArray(shopJSON)) {
      return res.status(500).json({ error: "商店資料格式錯誤，應為陣列" });
    }

    const coords1 = { latitude, longitude };
    const result = shopJSON.filter((shop) => {
      const shopLat = parseFloat(shop.latitude);
      const shopLon = parseFloat(shop.longitude);

      if (isNaN(shopLat) || isNaN(shopLon) || !isFinite(shopLat) || !isFinite(shopLon)) {
        return {};
      }

      const coords2 = { latitude: shopLat, longitude: shopLon };
      return havesineDistance(coords1, coords2) <= 2;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API出錯(商店位置)" });
  }
});

//top5 product
router.get('/top5Product', async (req, res) => {
    try {
        const productString = await readJsonFromMongo("product");
        let productJSON = JSON.parse(productString);
        const top5Product = productJSON.sort((a, b) => b.hot - a.hot).slice(0, 5)
        res.json(top5Product);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'top5 api 錯誤' });
    }
})

//   const { keyword, minprice, maxprice } = req.params;
//   const productString= await readJsonFromMongo("product");
//   const productJSON = JSON.parse(productString);
//   console.log(typeof productJSON)
//     let result = productJSON.data.filter((data) => {
//     return (
//     data.name.replace(/\s+/, "").toLowerCase().indexOf(keyword) != -1 &&
//     data.price_hkd >= minprice &&data.price_hkd <= maxprice
//     );
//     });
//  res.end(result);
//   console.log(param1, param2, param3);
//res.send(`Parameters: ${param1}, ${param2}, ${param3}`);
//});

//product.json -> mongoDB product 會覆蓋新舊資料
// router.get("/initmongo", async (req, res) => {
//     try {
//         await importJsonToMongo();
//     } catch (error) {
//         console.log("json to mongo fail.")
//         console.log(error)
//     }
// })

router.post("/login", authenticate, (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { "expiresIn": "2h" })
    res.json({ token });
})

export default router;