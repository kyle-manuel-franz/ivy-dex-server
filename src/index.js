const express = require('express')
const config = require('config')
const port = config.port

const app = express()

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})

