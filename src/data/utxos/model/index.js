const mongoose = require('mongoose')

const valueSchema = new mongoose.Schema({
    unit: String,
    quantity: String
}, { _id: false })

const utxoSchema = new mongoose.Schema({
    address: String,
    tx_hash: String,
    output_index: Number,
    amount: [valueSchema],
    block: String,
    data_hash: String
})

const utxoModel = mongoose.model("utxo", utxoSchema)

module.exports = utxoModel