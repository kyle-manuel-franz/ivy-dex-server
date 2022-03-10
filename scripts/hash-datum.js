/*
    Script to play around with some of the serialization lib functions provided by emurgo
 */

const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")

const toHex = (bytes) => Buffer.from(bytes).toString("hex");

const hashDatum = datum => {
    const res = slib.hash_plutus_data(datum)
    return toHex(res.to_bytes())
}

const odOwner = 'c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'
const odBook = 'c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'

console.log(toHex('c2ff616e11299d9094ce0a7eb5b7284b705147a822f4ffbd471f971a'))
console.log(hashDatum(slib.PlutusData.new_integer(slib.BigInt.from_str("42"))))
