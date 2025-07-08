import express from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { readJSONfile, writeJSONfile, getJSON } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productPath = path.join(__dirname, 'product.json');
const shopPath = path.join(__dirname, 'shop.json');
const QAPath = path.join(__dirname, 'question.json');

const router = express.Router();

router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON input' });
    }
    next(err);
})

//login adminList
//password = abcdeee
const users = [
    { "id": "1", "username": "sssssssuperUser", "password": "$2a$12$gXv3BT1izWLzlBQPTdpXB.w11JHPjw3MKhrSD7s8Yt0F8gwYuOzR6" }
]

const authenticate = (req, res, next) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && bcrypt.compareSync(password, user.password))
    {
        req.user = { "id": user.id, "username": user.username };
        next();
    }else{
        res.status(400).json({ "err": "input wrong!! user or password!" });
    }
}

const authorize = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;//the bearer and token
        if (authHeader === undefined || authHeader === null) {
            return res.sendStatus(401);
        }
        const token = authHeader.split(" ")[1];
        if (token == null)
            return res.sendStatus(401);

        jwt.verify(token, "secret_key", (err, userobj) => {
            if (err)
                return res.sendStatus(403);

            req.user = userobj;
            next();
        })
    } catch (error) {
        console.log(error);
    }
}

//show all product done
router.get("/productAll", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        res.end(readfile);
    } catch (error) {
        console.log("Error cathed:Get productJSON fail.");
        console.log(error);
    }
})

//show all shop done
router.get("/shopAll", async (req, res) => {
    try {
        let readfile = await readJSONfile(shopPath);
        res.end(readfile);
    } catch (error) {
        console.log("Error cathed:Get shopJSON fail.");
        console.log(error);
    }
})


//show all qna done
router.get("/questionAll", async (req, res) => {
    try {
        let readfile = await readJSONfile(QAPath);
        res.end(readfile);
    } catch (error) {
        console.log("Error cathed:Get QAJSON fail.");
        console.log(error);
    }
})

//find product by id done
router.get("/product/:pid", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readfile).filter((item) => item.id == req.params.pid)
        res.end(JSON.stringify(jsonOBJ));
    } catch (error) {
        console.log("Error catched:Get court fail.");
        console.log(error);
    }
})

//about product CRUD
//addproduct (need authorize ) done
router.post("/addproduct", authorize, async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readfile);
        let inputData = req.body;
        jsonOBJ.push(inputData);
        await writeJSONfile(productPath, JSON.stringify(jsonOBJ));
        res.status(201).send(JSON.stringify(jsonOBJ));
    } catch (error) {
        res.status(400).json({ "err": "Error catched:Add product fail" });
        console.log("Error catched:Add product fail.")
        console.log(error);
    }
})

//updateproduct by id (need authorize) done
router.put("/editproduct/:pid", authorize,async (req, res) => {
    try {
        let readFile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readFile);
        let findObj = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        let inputData = req.body;//new obj per
        if (findObj != -1) {
            jsonOBJ[findObj] = inputData;
            await writeJSONfile(productPath, JSON.stringify(jsonOBJ));
            res.status(201).send(JSON.stringify(jsonOBJ));
        }
        else
            res.status(400).json({ "err": "Edit product fail" });
    }
    catch (error) {
        res.status(400).json({ "Error": "Error Catched:Edit product fail." })
        console.log("Error catched:Edit product fail");
        console.log(error);
    }
})

//deleteproduct by id (need authorize) done
router.delete("/delproduct/:pid", authorize,async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath)
        let jsonOBJ = JSON.parse(readfile);
        let itemIndex = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        if (itemIndex != -1) {
            
            jsonOBJ.splice(itemIndex, 1);
            await writeJSONfile(productPath, JSON.stringify(jsonOBJ))
            res.end(JSON.stringify(jsonOBJ));
        } else {
            res.status(400).json({ "err": "Invalid product id" });
        }
    } catch (error) {
        console.log("Error catched:Delete product fail.")
        console.log(error)
    }
})

//about shop CRUD
//add (need authorize ) done
router.post("/addshop", authorize, async (req, res) => {
    try {
        let readfile = await readJSONfile(shopPath);
        let jsonOBJ = JSON.parse(readfile);
        let inputData = req.body;
        jsonOBJ.push(inputData);
        await writeJSONfile(shopPath, JSON.stringify(jsonOBJ));
        res.status(201).send(JSON.stringify(jsonOBJ));
    } catch (error) {
        res.status(400).json({ "err": "Error catched:Add shop fail" });
        console.log(error);
    }
})

//update by id (need authorize) done
router.put("/editshop/:pid", authorize,async (req, res) => {
    try {
        let readFile = await readJSONfile(shopPath);
        let jsonOBJ = JSON.parse(readFile);
        let findObj = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        let inputData = req.body;//new obj per
        if (findObj != -1) {
            jsonOBJ[findObj] = inputData;
            await writeJSONfile(shopPath, JSON.stringify(jsonOBJ));
            res.status(201).send(JSON.stringify(jsonOBJ));
        }
        else
            res.status(400).json({ "err": "Edit shop fail" });
    }
    catch (error) {
        res.status(400).json({ "Error": "Error Catched:Edit shop fail." })
        console.log(error);
    }
})

//delete by id (need authorize) done
router.delete("/delshop/:pid", authorize,async (req, res) => {
    try {
        let readfile = await readJSONfile(shopPath)
        let jsonOBJ = JSON.parse(readfile);
        let itemIndex = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        if (itemIndex != -1) {
            
            jsonOBJ.splice(itemIndex, 1);
            await writeJSONfile(shopPath, JSON.stringify(jsonOBJ))
            res.end(JSON.stringify(jsonOBJ));
        } else {
            res.status(400).json({ "err": "Invalid shop id" });
        }
    } catch (error) {
        console.log("Error catched:Delete shop fail.")
        console.log(error)
    }
})


//about shop CRUD
//add (need authorize ) done
router.post("/addqa", authorize, async (req, res) => {
    try {
        let readfile = await readJSONfile(QAPath);
        let jsonOBJ = JSON.parse(readfile);
        let inputData = req.body;
        jsonOBJ.push(inputData);
        await writeJSONfile(QAPath, JSON.stringify(jsonOBJ));
        res.status(201).send(JSON.stringify(jsonOBJ));
    } catch (error) {
        res.status(400).json({ "err": "Error catched:Add shop fail" });
        console.log(error);
    }
})

//update by id (need authorize) done
router.put("/editqa/:pid", authorize,async (req, res) => {
    try {
        let readFile = await readJSONfile(QAPath);
        let jsonOBJ = JSON.parse(readFile);
        let findObj = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        let inputData = req.body;//new obj per
        if (findObj != -1) {
            jsonOBJ[findObj] = inputData;
            await writeJSONfile(QAPath, JSON.stringify(jsonOBJ));
            res.status(201).send(JSON.stringify(jsonOBJ));
        }
        else
            res.status(400).json({ "err": "Edit shop fail" });
    }
    catch (error) {
        res.status(400).json({ "Error": "Error Catched:Edit shop fail." })
        console.log(error);
    }
})

//delete by id (need authorize) done
router.delete("/delqa/:pid", authorize,async (req, res) => {
    try {
        let readfile = await readJSONfile(QAPath)
        let jsonOBJ = JSON.parse(readfile);
        let itemIndex = jsonOBJ.findIndex((item) => item.id == req.params.pid);
        if (itemIndex != -1) {
            
            jsonOBJ.splice(itemIndex, 1);
            await writeJSONfile(QAPath, JSON.stringify(jsonOBJ))
            res.end(JSON.stringify(jsonOBJ));
        } else {
            res.status(400).json({ "err": "Invalid shop id" });
        }
    } catch (error) {
        console.log("Error catched:Delete shop fail.")
        console.log(error)
    }
})

router.post("/login", authenticate, (req, res) => {
    const token = jwt.sign(req.user, "secret_key", { "expiresIn": "1h" })
    res.json({ token });
})

export default router;