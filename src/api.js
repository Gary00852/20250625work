import express from 'express';
import { readJSONfile, writeJSONfile, getJSON } from './db.js';
const router = express.Router();


router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON input' });
    }
    next(err);
})

const productPath = "./src/product.json";
const shopPath = "./src/shop.json";
const QAPath = "./src/q&a.json";

//1.find all product done
router.get("/productAll", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        res.end(readfile);
        // console.log(readfile);
    } catch (error) {
        console.log("Error cathed:Get courts fail.");
        console.log(error);
    }
})

//2.find product by id done
router.get("/product/:pid", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readfile).filter((item) => item.product_id == req.params.pid)
        res.end(JSON.stringify(jsonOBJ));
    } catch (error) {
        console.log("Error catched:Get court fail.");
        console.log(error);
    }
})

//3.use body add (need admin )
router.post("/addproduct", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readfile);
        let inputData = req.body;
        jsonOBJ.push(inputData);
        // console.log(jsonOBJ);
        await writeJSONfile(productPath, JSON.stringify(jsonOBJ));
        res.status(201).send(JSON.stringify(jsonOBJ));
    } catch (error) {
        productPath
        res.status(400), json({ "err": "Error catched:Add court fail" });
        console.log("Error catched:Add court fail.")
        console.log(error);
    }
})

//4.update by id (need admin)
router.put("/editproduct/:pid", async (req, res) => {
    try {
        let readFile = await readJSONfile(productPath);
        let jsonOBJ = JSON.parse(readFile);
        let courtOBJidx = jsonOBJ.findIndex((item) => item.product_id == req.params.pid);
        let inputData = req.body;
        if (courtOBJidx != -1) {
            jsonOBJ[courtOBJidx] = inputData;
            console.log(jsonOBJ);
            await writeJSONfile(productPath, JSON.stringify(jsonOBJ));
            res.status(201).send(JSON.stringify(jsonOBJ));
        }
        else
            throw new Error("Error catched:Edit court fail.")
    }
    catch (error) {
        res.status(400).json({ "Error": "Error Catched:Edit court fail." })
        console.log("Error catched:Edit court fail");
        console.log(error);
    }
})



//5.delete by id (need admin)
router.delete("/delproduct/:pid", async (req, res) => {
    try {
        let readfile = await readJSONfile(productPath)
        let jsonOBJ = JSON.parse(readfile);
        // console.log()
        let courtIdx = jsonOBJ.findIndex((court) => court.product_id == req.params.pid);
        if (courtIdx != -1) {
            jsonOBJ.splice(courtIdx, 1);
            await writeJSONfile(productPath, JSON.stringify(jsonOBJ))
            res.end(JSON.stringify(jsonOBJ));
            console.log(JSON.stringify(jsonOBJ));
        } else {
            throw new Error("Error catched.Invalid court id.")
        }
    } catch (error) {
        console.log("Error catched:Delete court fail.")
        console.log(error)
    }
})

router.get("/SHOP", async (req, res) => {
    try {
        let readfile = await readJSONfile(shopPath);
        res.end(readfile);
        // console.log(readfile);
    } catch (error) {
        console.log("Error cathed:Get shopJSON fail.");
        console.log(error);
    }
})

export default router;






















// import express from 'express';
// import { getUser, addUser } from './db.js';
// const router = express.Router();

// router.get('/user/:id', async (req, res) => {
//   try {
//     const user = await getUser(req.params.id);
//     if (user) {
//       res.json(user);
//     } else {
//       res.status(404).json({ error: 'User not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/user', async (req, res) => {
//   try {
//     const { id, name } = req.body;
//     const result = await addUser({ id, name });
//     res.json({ message: 'User added', insertedId: result.insertedId });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// export default router;