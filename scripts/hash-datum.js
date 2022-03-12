/*
    Script to play around with some of the serialization lib functions provided by emurgo
 */
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")

const { mkSerializedOrderDatum } = require('../src/lib/ledger')

const toHex = (bytes) => Buffer.from(bytes).toString("hex");
const fromHex = (hex) => Buffer.from(hex, "hex");

const hashDatum = datum => {
    const res = slib.hash_plutus_data(datum)
    return toHex(res.to_bytes())
}

const odOwner = toHex('c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a')
const odBook = toHex('c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a')

const odBuyerTokenName = toHex('')
const odBuyerCurrencySymbol = ''
const odBuyerTokenAmount = "10000"

const odSellerTokenName = toHex('XYZ')
const odSellerCurrencySymbol = 'c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'
const odSellerTokenAmount = "10000"

console.log(hashDatum(mkSerializedOrderDatum(
    odOwner,
    odBook,

    odBuyerTokenName,
    odBuyerCurrencySymbol,
    odBuyerTokenAmount,

    odSellerTokenName,
    odSellerCurrencySymbol,
    odSellerTokenAmount
)))
