const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    policyId: String,
    tokenName: String,
    tokenNameUtf: String,
    fingerprint: String,
    asset: String,
    metadata: Object,
    quantity: Number
})

const tokenModel = mongoose.model("token", tokenSchema)

module.exports = tokenModel