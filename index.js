const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


require('dotenv').config();

const app = express();


const port = process.env.PORT || 5000;




// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mpeq17q.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesCollection = client.db('TapForDeliciousDB').collection('services');
        const usersCollection = client.db('TapForDeliciousDB').collection('users');
        const blogsCollection = client.db('TapForDeliciousDB').collection('blogs');
        const reviewCollection = client.db('TapForDeliciousDB').collection('reviews');
        const ordersCollection = client.db('TapForDeliciousDB').collection('orders');

        // Top Food part

        // Top Food part
        
        app.get('/services', async (req, res) => {
            const query = {};
            const options = await servicesCollection.find(query).toArray();
            res.send(options);
        });

        app.get('/services-limit', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const topRestaurant = await cursor.limit(6).toArray();
            res.send(topRestaurant);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.send(service);
        });

        //review
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray().sort({ _id: -1 });
            res.send(reviews);

        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review)
            const result = await reviewCollection.insertOne(review);
            res.send(result);

        });

        // Users
        app.post('/users', async (req, res) => {
            const user = req.body;
            user.joinDate = Date();
            const query = {
                email: user.email
            }
            const alreadyUser = await usersCollection.find(query).toArray();
            if (alreadyUser.length) {
                const message = 'User already exists'
                return res.send({ acknowledged: false, message: message })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        // Blogs
        app.get('/blogs', async (req, res) => {
            const query = {};
            const blogs = await blogsCollection.find(query).toArray();
            res.send(blogs);
        })

        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            blog.date = Date();
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });

        // Orders
        app.get('/orders', async (req, res) => {
            const query = {};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.date = Date();
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });
    }
    finally {

    }

}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('API running');
})

app.listen(port, () => {
    console.log('Server is running on port', port);
})