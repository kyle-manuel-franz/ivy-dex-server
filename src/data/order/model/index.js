const mongoose = require('mongoose')

const orderValueSchema = new mongoose.Schema({
    name: String,
    currencySymbol: String,
    amount: Number
}, { _id: false })

const blockfrostUtxoSchema = new mongoose.Schema({
    tx_hash: String,
    tx_input: Number,
    output_index: Number,
    amount: Array,
    block: String,
    data_hash: String,
}, { _id: false })

const orderSchema = new mongoose.Schema({
    ownerAddress: String,
    ownerPubKeyHash: String,

    buyerValue: orderValueSchema,
    sellerValue: orderValueSchema,
    txHash: String,

    status: String,
    scriptAddress: String,

    utxo: blockfrostUtxoSchema,
    takerAddress: String,

    closedAt: Date,

    syncProgress: String,
    syncAttempts: Number
}, { timestamps: true })

orderSchema.index({
    txHash: 1,
    ownerPubKeyHash: 1
}, {
    unique: true
})

orderSchema.index({
    'buyerValue.name': 1,
    'buyValue.currencySymbol': 1
}, {
    unique: false
})

orderSchema.index({
    'sellerValue.name': 1,
    'sellerValue.currencySymbol': 1
}, {
    unique: false
})

orderSchema.index({
    ownerPubKeyHash: 1,
}, {
    unique: false
})

orderSchema.index({
    status: 1,
}, {
    unique: false
})

const orderModel = mongoose.model("order", orderSchema)

module.exports = orderModel