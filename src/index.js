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
    console.log('api/tokens')
    res.send(JSON.stringify(tokens))
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})