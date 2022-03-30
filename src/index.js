const express = require('express')
const config = require('config')
const port = config.port
// TODO: turn this off in production
const cors = require('cors');
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')
const orderModel = require('./data/order/model')

const { initializeMongoDbConnection } = require('./lib/mongoose')

const app = express()
app.use(cors())
app.use(morgan('common'))
app.use(express.json())
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()
    res.send(JSON.stringify(tokens))
})

// TODO: move this to a separate router and handler with validation and what not
app.post('/api/datum', async (req, res, next) => {
    const { data: { buyerValue, sellerValue, ownerPubKeyHash, ownerAddress }} = req.body

    const order = new orderModel({
        buyerValue,
        sellerValue,
        ownerAddress,
        ownerPubKeyHash,
        status: "OPEN"
    })

    await order.save()

    res.send('OK')
})

// This end point should update the open UTXOs as spend for the purposes of the UI
// If the order fails, this will update back from CLOSED to OPEN
// I'll have another job for that
app.post('/api/datum/:id/spend', async (req, rex, next) => {
    const { id } = req.params

})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})