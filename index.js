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
        const usersCollection = client.db('doctorsportaldb').collection('users')
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
        });
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const bookings = await bookingCollections.find(query).toArray();
            res.send(bookings);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }

            const alreadyBooked = await bookingCollections.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingCollections.insertOne(booking);
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '12h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });


        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


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