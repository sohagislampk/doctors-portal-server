const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//miiddleware
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9qpmxm2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionsCollections = client.db('doctorsportaldb').collection('appointmentoptions')
        const bookingCollections = client.db('doctorsportaldb').collection('bookings')
        app.get('/appointmentoptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionsCollections.find(query).toArray();
            // get the bookings of the provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingCollections.find(bookingQuery).toArray();

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })

            res.send(options);
        })
        app.post('/bookings', async (req, res) => {
            const booking = req.body;

            const result = await bookingCollections.insertOne(booking);
            res.send(result);
        })


    }
    finally {

    }
}
run().catch(error => console.error(error));



app.get('/', async (req, res) => {
    res.send('Server is Running')
})

app.listen(port, () =>
    console.log(`Server is runnung on port : ${port}`)
)