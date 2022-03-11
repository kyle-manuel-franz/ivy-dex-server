/*
    Script to play around with some of the serialization lib functions provided by emurgo
 */

const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")

const toHex = (bytes) => Buffer.from(bytes).toString("hex");
const fromHex = (hex) => Buffer.from(hex, "hex");

const hashDatum = datum => {
    const res = slib.hash_plutus_data(datum)
    return toHex(res.to_bytes())
}


const odOwner = 'c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'
const odBook = 'c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'

const odBuyerValueTokenName = ''
const odBuyerValueTokenAmount = ''
const odBuyerValueCurrencySymbol = ''

const odSellerValueTokenName = ''
const odSellerValueTokenAmount = ''
const odSellerValueCurrencySymbol = ''


console.log(hashDatum(slib.PlutusData.new_bytes(toHex(odOwner))))
