const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.exyob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeaders.split(" ")[1];
    jwt.verify(token, process.env.SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: ' Forbidden access' })
        }
        req.decoded = decoded;
        next()
    });
}

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db("daku").collection("product");
        const userCollection = client.db("daku").collection("users");
        const orderCollection = client.db("daku").collection("order");
        const reviewCollection = client.db("daku").collection("review");

        app.get("/product", async (req, res) => {
            const count = parseInt(req.query.count);
            const myEmail = req.query.email;
            let query = {};
            if (myEmail) {
                query = { email: myEmail };
                const cursor = toolCollection.find(query);
                const stock = await cursor.toArray();
                res.send(stock);
            } else {
                query = {};
                const cursor = toolCollection.find(query);
                let stock;

                if (count) {
                    stock = await cursor.limit(count).toArray();
                } else {
                    stock = await cursor.toArray();
                }
                res.send(stock);
            }

        });

        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await toolCollection.findOne(query);
            res.send(product);
        });

        app.put("/product/:id", async (req, res) => {
            const id = req.params.id;
            const newData = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    available: newData.newquantity,
                },
            };
            const result = await toolCollection.updateOne(
                filter,
                updatedDoc,
                options
            );
            res.send(result);
        });

        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.deleteOne(query);
            res.send(result);
        });

        app.post("/product", async (req, res) => {
            const newData = req.body;
            const result = await toolCollection.insertOne(newData);
            res.send(result);
        });

        //📧📧📧📧📧📧📧📧📧 user email 📧📧📧📧📧📧📧📧📧
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            const token = jwt.sign({ email: email }, process.env.SECRET_TOKEN, { expiresIn: '100d' });
            res.send({ result, token });
        })

        //🍔🍔🍔🍔🍔🍔🍔🍔🍔 order 🍔🍔🍔🍔🍔🍔🍔🍔🍔
        app.post("/orders", async (req, res) => {
            const newData = req.body;
            const result = await orderCollection.insertOne(newData);
            res.send(result);
        });

        app.get('/orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const myOrders = await cursor.toArray();
                res.send(myOrders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }
        })

        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        //✨✨✨✨✨✨✨✨ review ✨✨✨✨✨✨✨✨
        app.get('/review', async (req, res) => {
            const count = parseInt(req.query.count);
            const query = {};
            const cursor = reviewCollection.find(query);
            let reviews;

            if (count) {
                reviews = await cursor.limit(count).toArray();
            } else {
                reviews = await cursor.toArray();
            }
            res.send(reviews);
        })

        app.post("/review", async (req, res) => {
            const newData = req.body;
            const result = await reviewCollection.insertOne(newData);
            res.send(result);
        });        

    } finally {
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("running...");
});

app.listen(port, () => {
    console.log("server is running on ", port);
});
