const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8qcwn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(client);



async function run() {
    try {
        await client.connect();
        const database = client.db('Helping_Hand');
        const usersCollection = database.collection('users');


        // save user api
        app.post('/users', async (req, res) => {
            const user = req.body;
            user["role"] = "member";
            const result = await usersCollection.insertOne(user);
            console.log('new user data saved');
            res.json(result);
        })

        // update user api
        app.put('/users', async (req, res) => {
            const user = req.body;
            const isOldUser = await usersCollection.findOne({ email: user.email });

            if (isOldUser) {
                const filter = { email: user.email };
                const options = { upsert: true };
                const updateDoc = { $set: user };
                const result = await usersCollection.updateOne(filter, updateDoc, options);

                console.log('old user data updated');
                res.json(result);
            }

            else {
                user["role"] = "member";
                const result = await usersCollection.insertOne(user);
                console.log('users data save with role');
                res.json(result);
            }
        })


        console.log('database connected');
    }
    finally {
        // await client.close();

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('It is a parcel task!')
})

app.listen(port, () => {
    console.log(`Port :${port}`)
})