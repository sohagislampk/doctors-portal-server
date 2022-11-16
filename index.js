const express = require('express');
const cors = require('cors')

const app = express();
const port = process.env.PORT || 5000;


//miiddleware
app.use(cors());
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('Server is Running')
})

app.listen(port, () =>
    console.log(`Server is runnung on port : ${port}`)
)