const config = require('config')
const mongoose = require('mongoose')
const network = require('../network')

const dbConfig = config.smartContractIndexMongoDb[network]
const mongoDb = `mongodb://${dbConfig.location}`

const initializeMongoDbConnection = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(mongoDb, { useNewUrlParser: true, user: 'root', pass: 'rootpassword', dbName: dbConfig.database })
        const db = mongoose.connection
        resolve(db)
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    })
}

module.exports = {
    initializeMongoDbConnection
}