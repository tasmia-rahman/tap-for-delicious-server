const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
require('dotenv').config()


const port = process.env.PORT || 5000;

const app = express();


// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mpeq17q.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesCollection = client.db('deliciousRestaurant').collection('services');

        app.get('/services', async(req, res) =>{
            const query = {};
            const options = await servicesCollection.find(query).toArray();
            res.send(options);
        })
        app.get('/services/:id', async(req, res) =>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.send(service);
        })
      


    }
    finally {

    }

}
run().catch(console.log)



app.get('/', (req, res) => {
    res.send('tap restaurant server is running');
})

app.listen(port, () => {
    console.log(`tap restaurant server running ${port}`);
})
