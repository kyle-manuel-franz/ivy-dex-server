const express = require('express')
const config = require('config')
const port = config.port

const tokenModel = require('./data/tokens/model')

const { initializeMongoDbConnection } = require('./lib/mongoose')

const app = express()
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()
    res.send(JSON.stringify(tokens))
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})