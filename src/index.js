const express = require('express')
const config = require('config')
const port = config.port

// TODO: turn this off in production
const cors = require('cors');
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')

const { initializeMongoDbConnection } = require('./lib/mongoose')

const app = express()
app.use(cors())
app.use(morgan('common'))
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()
    res.send(JSON.stringify(tokens))
})

app.get('/api/tx/place_order', async (req, res, next) => {
    // build transaction for place order

    res.status(200)
    res.send('success')
})

app.get('/api/tx/take_order', async (req, res, next) => {
    // build transaction for take order

    res.status(200)
    res.send('success')
})

app.get('/api/tx/cancel_order', async (req, res, next) => {
    // build transaction for cancel order

    res.status(200)
    res.send('success')
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})