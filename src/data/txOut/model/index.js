const mongoose = require('mongoose')

const valueSchema = new mongoose.Schema({
    unit: String,
    quantity: String
}, { _id: false })

const txOutSchema = new mongoose.Schema({
    address: String,
    amount: [valueSchema],
    data_hash: String
})

const txOutModel = mongoose.model("txOut", txOutSchema)

module.exports = txOutModela