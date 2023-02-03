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
        const restaurantsCollection = client.db('TapForDeliciousDB').collection('restaurants');
        const foodsCollection = client.db('TapForDeliciousDB').collection('foods');

        // Restaurants
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

        // ------------ Restaurants -------------- //
        app.post('/restaurant', async (req, res) => {
            const restaurant = req.body;
            const result = await restaurantsCollection.insertOne(restaurant);
            res.send(result);
        });

        app.get('/restaurants', async (req, res) => {
            const query = {};
            const result = await restaurantsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/restaurant/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await restaurantsCollection.findOne(query);
            res.send(result);
        });

        //------------------ Foods -----------------//
        app.get('/restaurants/:email', async (req, res) => {
            const email = req.params.email;
            const query = { resEmail: email };
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/topfood', async (req, res) => {
            const query = {};
            const cursor = foodsCollection.find(query);
            const result = await cursor.sort({ name: 1 }).toArray();
            res.send(result);
        })
        app.get('/topfood-limit', async (req, res) => {
            const query = {};
            const cursor = foodsCollection.find(query);
            const result = await cursor.sort({ name: 1 }).limit(4).toArray();
            res.send(result);
        })

        //review
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.sort({ _id: -1 }).toArray();
            res.send(reviews);

        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
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
            const query = { role: "buyer" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        //User role
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role === 'seller') {
                sellerInfo = user;
            }
            else {
                sellerInfo = {};
            }

            if (user?.role === 'buyer') {
                buyerInfo = user;
            }
            else {
                buyerInfo = {};
            }
            res.send({ sellerInfo, buyerInfo, isAdmin: user?.role === 'admin', isSeller: user?.role === 'seller', isBuyer: user?.role === 'buyer' });
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
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { buyerEmail: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/seller_orders/:restaurantName', async (req, res) => {
            const restaurantName = req.params.restaurantName;
            const query = { restaurantName: restaurantName };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/seller_orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(filter);
            res.send(order);
        });

        app.put('/seller_orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const order = req.body;
            const updatedDoc = {
                $set: {
                    orderStatus: order.orderStatus
                }
            }
            const options = { upsert: true };
            const result = await ordersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

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