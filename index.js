const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const { response } = require('express');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const stripe = require("stripe")('sk_test_51MbMEwEEljFKzkqncKtudkxGL5t1Y7mdOebSwcL6fkaDbma5iAA7HEUmQcthw7dNStRs0nUjclAQcMxoAwt2wnFR00MzJ0PjJR');
const port = process.env.PORT || 5000;
const app = express();


// middle wares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extented: true }));
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mpeq17q.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');

    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log(err)
            return res.status(403).send({ message: 'forbidden access' })

        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const servicesCollection = client.db('TapForDeliciousDB').collection('services');
        const usersCollection = client.db('TapForDeliciousDB').collection('users');
        const blogsCollection = client.db('TapForDeliciousDB').collection('blogs');
        const reviewCollection = client.db('TapForDeliciousDB').collection('reviews');
        const ordersCollection = client.db('TapForDeliciousDB').collection('orders');
        const restaurantsCollection = client.db('TapForDeliciousDB').collection('restaurants');
        const foodsCollection = client.db('TapForDeliciousDB').collection('foods');
        const reportsCollection = client.db('TapForDeliciousDB').collection('reports');
        const topFoodsCollection = client.db('TapForDeliciousDB').collection('topFoods');
        const advertisesCollection = client.db('TapForDeliciousDB').collection('advertises');
        const paymentsCollection = client.db('TapForDeliciousDB').collection('payments');

        // Restaurants
        app.get('/services', async (req, res) => {
            const query = {};
            const options = await servicesCollection.find(query).toArray();
            res.send(options);
        });

        // search start
        app.get('/search', async (req, res) => {
            try {
                let result = await foodsCollection.aggregate([
                    {
                        "$search": {
                            "autocomplete": {
                                "query": `${req.query.term}`,
                                "path": "name",
                                "fuzzy": {
                                    "maxEdits": 2
                                }
                            }
                        }
                    }
                ]).toArray();
                res.send(result);
            } catch (e) {
                res.status(500).send({ message: e.message });
            }
        });

        app.get("/search/:id", async (req, res) => {
            try {
                let result = await foodsCollection.findOne({ "_id": ObjectId(request.params.id) });
                response.send(result);
            }
            catch (e) {
                res.status(500).send({ message: e.message });
            }
        })
        // search end

        //Payment-start

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body.total;
            const price = order;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.orderId
            const filter = { _id: ObjectId(id) }
            const options={upsert:true}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc,options)
            console.log(updatedResult);
            res.send(result);
        })

        //Payment-end

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
        app.post('/restaurant', verifyJWT, async (req, res) => {
            const restaurant = req.body;
            const result = await restaurantsCollection.insertOne(restaurant);
            res.send(result);
        });

        app.get('/restaurants', async (req, res) => {
            const query = {};
            const result = await restaurantsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/restaurants-limit', async (req, res) => {
            const query = {};
            const result = await restaurantsCollection.find(query).limit(6).toArray();
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

        app.post('/food', async (req, res) => {
            const food = req.body;
            const result = await foodsCollection.insertOne(food);
            res.send(result);
        });

        //review
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query).sort({ _id: -1 });
            const reviews = await cursor.limit(6).toArray();
            res.send(reviews);

        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            review.date = Date();
            const result = await reviewCollection.insertOne(review);
            res.send(result);

        });

        //JWT
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "7d" });
            console.log(token);
            return res.send({ accessToken: token });

        });


        // Users
        app.post('/users', async (req, res) => {
            const user = req.body;
            user.joinDate = Date();
            const query = {
                email: user.email
            }
            const alreadyUser = await usersCollection.find(query).toArray();

            console.log("user", alreadyUser)
            if (alreadyUser.length) {
                const message = 'User already exists'
                return res.send({ acknowledged: false, message: message })
            }
            // // For facebook
            // const filter = {
            //     uid: user.uid
            // }
            // const alreadyFacebookUser = await usersCollection.find(filter).toArray();
            // if (alreadyFacebookUser.length) {
            //     const message = 'User already exists'
            //     return res.send({ acknowledged: false, message: message })
            // }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = { role: "buyer" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })

        app.put('/user', async (req, res) => {
            const filterEmail = req.query.email;
            const filter = { email: filterEmail }
            const user = req.body;
            const { displayName, phone, road, area, house, postal, photoUrl } = user;
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    displayName: displayName,
                    phone: phone,
                    road: road,
                    area: area,
                    house: house,
                    postal: postal,
                    photoUrl: photoUrl
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
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

        //Buyers
        app.get('/buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
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
        app.get('/all_orders', async (req, res) => {
            const query = {};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/orders_with_uid/:uid', async (req, res) => {
            const uid = req.params.uid;
            const query = { uid: uid };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/orders_with_email/:email', async (req, res) => {
            const email = req.params.email;
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

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

        app.put('/order_status/:id', async (req, res) => {
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

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(filter);
            res.send(result);
        })

        // Top foods
        let uniqueId = 1;
        app.post('/topFoods', async (req, res) => {
            const cartItem = req.body;
            cartItem._id = uniqueId;
            uniqueId++;
            const result = await topFoodsCollection.insertOne(cartItem);
            res.set({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.send(result);
        });

        // Advertises
        app.get('/advertises', async (req, res) => {
            const query = {};
            const advertises = await advertisesCollection.find(query).toArray();
            res.send(advertises);
        });

        app.get('/advertises/:restaurantName', async (req, res) => {
            const restaurantName = req.params.restaurantName;
            const query = { restaurantName: restaurantName };
            const advertises = await advertisesCollection.find(query).toArray();
            res.send(advertises);
        });

        app.post('/advertises', async (req, res) => {
            const advertise = req.body;
            advertise.date = Date();
            const result = await advertisesCollection.insertOne(advertise);
            res.send(result);
        });

        app.patch('/advertises/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    isAdvertised: true
                }
            }
            const result = await advertisesCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/advertises/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await advertisesCollection.deleteOne(filter);
            res.send(result);
        })

        // Reports
        app.get('/reports', async (req, res) => {
            const query = {};
            const reports = await reportsCollection.find(query).toArray();
            res.send(reports);
        });

        app.post('/reports', async (req, res) => {
            const report = req.body;
            report.date = Date();
            const result = await reportsCollection.insertOne(report);
            res.send(result);
        });

        app.delete('/reports/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportsCollection.deleteOne(filter);
            res.send(result);
        })

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