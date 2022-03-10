const config = require('config')
const mongoose = require('mongoose')
const network = require('../network')

const dbConfig = config.smartContractIndexMongoDb[network]
const mongoDb = `mongodb://${dbConfig.location}`

const initializeMongoDbConnection = () => {
    mongoose.connect(mongoDb, { useNewUrlParser: true, user: dbConfig.user, pass: dbConfig.password, dbName: dbConfig.database })
    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

module.exports = {
    initializeMongoDbConnection
}