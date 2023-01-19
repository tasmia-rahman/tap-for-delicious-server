


const port = process.env.PORT || 5000;




// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mpeq17q.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesCollection = client.db('TapForDeliciousDB').collection('services');
        const sellersCollection = client.db('TapForDeliciousDB').collection('sellers');

        // Restaurants
        app.get('/services', async (req, res) => {
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

        // Sellers
        app.post('/sellers', async (req, res) => {
            const seller = req.body;
            seller.joinDate = Date();
            const result = await sellersCollection.insertOne(seller);
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