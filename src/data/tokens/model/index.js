const mongoose = require('mongoose')

const tokenMetadataSchema = new mongoose.Schema({
    subject: String,
    url: Object,
    name: Object,
    ticker: Object,
    policy: String,
    logo: Object,
    description: Object,
}, { _id: false })

const tokenSchema = new mongoose.Schema({
    policyId: { type:String, unique: true },
    tokenName: String,
    tokenNameUtf: String,
    fingerprint: String,
    asset: String,
    metadata: tokenMetadataSchema,
    quantity: Number
})

const tokenModel = mongoose.model("token", tokenSchema)

module.exports = tokenModel