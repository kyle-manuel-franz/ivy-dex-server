const mongoose = require('mongoose')

const orderValueSchema = new mongoose.Schema({
    name: String,
    currencySymbol: String,
    amount: Number
}, { _id: false })

const orderSchema = new mongoose.Schema({
    ownerAddress: String,
    ownerPubKeyHash: String,

    buyerValue: orderValueSchema,
    sellerValue: orderValueSchema,
    txHash: String,

    status: String,
    scriptAddress: String,
})

const orderModel = mongoose.model("order", orderSchema)

module.exports = orderModel