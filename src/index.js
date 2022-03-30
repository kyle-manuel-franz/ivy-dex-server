const express = require('express')
const config = require('config')
const port = config.port
// TODO: turn this off in production
const cors = require('cors');
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')
const orderModel = require('./data/order/model')

const { initializeMongoDbConnection } = require('./lib/mongoose')

const Queue = require('bull')
const syncQueue = new Queue('sync_queue', 'redis://127.0.0.1:6379')

const app = express()
app.use(cors())
app.use(morgan('common'))
app.use(express.json())
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()
    // syncQueue.add({ data: 'hi' })
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

app.get('/api/orders/:currencySymbol/:tokenName', async (req, res, next) => {
    const { currencySymbol, tokenName } = req.params
    const orders = await orderModel.find({
        $or: [
            {
                'buyerValue.name': tokenName,
                'buyerValue.currencySymbol': currencySymbol,
                status: 'OPEN'
            },
            {
                'sellerValue.name': tokenName,
                'sellerValue.currencySymbol': currencySymbol,
                status: 'OPEN'
            }
        ]
    })
    res.send(orders)
})

app.get('/api/orders/:paymentPubKeyHash', async (req, res, next) => {
    const { paymentPubKeyHash } = req.params
    const orders = await orderModel.find({
        ownerPubKeyHash: { $regex: new RegExp(`^${paymentPubKeyHash}`)}
    })

    res.send(orders)
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})