const mongoose = require('mongoose')

const orderDatumSchema = new mongoose.Schema({
    odOwner: String,
    odBook: String,

    odBuyerTokenName: String,
    odBuyerCurrencySymbol: String,
    odBuyerTokenAmount: Number,

    odSellerTokenName: String,
    odSellerCurrencySymbol: String,
    odSellerTokenAmount: Number,

    odOwnerAddress: String,

    datum_hash: String,
})

const orderDatumModel = mongoose.model("orderDatum", orderDatumSchema)

module.exports = orderDatumModel