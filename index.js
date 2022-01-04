const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8qcwn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);



async function run() {
    try {
        await client.connect();
        const database = client.db('Helping_Hand');
        const usersCollection = database.collection('users');
        const eventsCollection = database.collection('events');
        const donorsCollection = database.collection('donors');
        const feedbackCollection = database.collection('feedback');
        const causesCollection = database.collection('causes');
        const reviewsCollection = database.collection('reviews');

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

        // get user api
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            console.log('Users found');
            res.send(users);
        })

        // change user role        
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            if (user.role === 'member') {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'admin' } };
                const result = await usersCollection.updateOne(filter, updateDoc);

                console.log('user role set to admin');

                const data = { result, role: 'admin' }
                res.json(data);
            }
            // console.log(user)
            else {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'member' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                console.log('user role set to member');
                const data = { result, role: 'member' }
                res.json(data);
            }
        })

        // check user role admin or not 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            console.log('admin : ', isAdmin);
            res.json(isAdmin);
        })


        // get events api
        app.get('/events', async (req, res) => {
            const cursor = eventsCollection.find({});
            const events = await cursor.toArray();
            console.log('events generated');
            res.send(events);
        })

        // get target event api
        app.get('/events/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const event = await eventsCollection.findOne(query);
            console.log("target event found");
            res.json(event);
        })

        // add event api
        app.post('/events', async (req, res) => {
            const data = req.body;
            const result = await eventsCollection.insertOne(data);
            console.log('Event added');
            res.json(result);
        })


        // review adding
        app.post('/review', async (req, res) => {
            const data = req.body;
            const result = await reviewsCollection.insertOne(data);

            res.json(result);
        })


        // save donor details api
        app.post('/donors', async (req, res) => {
            const data = req.body;
            const result = await donorsCollection.insertOne(data);
            console.log('donor details added');
            res.json(result);
        })

        // get donor details api
        app.get('/donors', async (req, res) => {
            const cursor = donorsCollection.find({});
            const events = await cursor.toArray();
            console.log('events generated');
            res.send(events);
        })

        // add feedback api
        app.post('/feedback', async (req, res) => {
            const data = req.body;
            const result = await feedbackCollection.insertOne(data);
            console.log('feedback added');
            res.json(result);
        });

        // GET API for show feedback
        app.get("/feedback", async (req, res) => {
            const cursor = feedbackCollection.find({});
            const feedback = await cursor.toArray();
            res.send(feedback);
        });
        // add causes api
        app.post('/causes', async (req, res) => {
            const data = req.body;
            const result = await causesCollection.insertOne(data);
            console.log('causes added');
            res.json(result);
        })
        // GET API for show causes
        app.get("/causes", async (req, res) => {
            const cursor = causesCollection.find({});
            const causes = await cursor.toArray();
            res.send(causes);
        });
        //payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.amount * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            })
            res.json({ clientSecret: paymentIntent.client_secret })
        })

        console.log('database connected');
    }
    finally {
        // await client.close();

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('It is a team project!')
})

app.listen(port, () => {
    console.log(`Port :${port}`)
})