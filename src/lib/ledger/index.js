const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")
const toHex = (bytes) => Buffer.from(bytes).toString("hex");
const fromHex = (hex) => Buffer.from(hex, "hex");

const hashDatum = orderDatum => {
    const datum = mkSerializedOrderDatum(
        orderDatum.odOwner,
        orderDatum.odBook,

        orderDatum.odBuyerTokenName,
        orderDatum.odBuyerCurrencySymbol,
        orderDatum.odBuyerTokenAmount,

        orderDatum.odSellerTokenName,
        orderDatum.odSellerCurrencySymbol,
        orderDatum.odSellerTokenAmount
    )
    return slib.hash_plutus_data(datum)
}

const mkSerializedOrderDatum = (
    odOwner,
    odBook,

    odBuyerTokenName,
    odBuyerCurrencySymbol,
    odBuyerTokenAmount,

    odSellerTokenName,
    odSellerCurrencySymbol,
    odSellerTokenAmount,
) => {
    // The order in which we add fields to this list is very important
    // it must match exactly the order in which the fields are defined
    // in the OrderDatum in the Haskell smart contract

    const fieldList = slib.PlutusList.new()
    fieldList.add(slib.PlutusData.new_bytes(fromHex(odOwner)))
    fieldList.add(slib.PlutusData.new_bytes(fromHex(odBook)))

    fieldList.add(slib.PlutusData.new_bytes(fromHex(odBuyerTokenName)))
    fieldList.add(slib.PlutusData.new_bytes(fromHex(odBuyerCurrencySymbol)))
    fieldList.add(slib.PlutusData.new_integer(slib.BigInt.from_str(odBuyerTokenAmount)))

    fieldList.add(slib.PlutusData.new_bytes(fromHex(odSellerTokenName)))
    fieldList.add(slib.PlutusData.new_bytes(fromHex(odSellerCurrencySymbol)))
    fieldList.add(slib.PlutusData.new_integer(slib.BigInt.from_str(odSellerTokenAmount)))

    const datumConstructor = slib.PlutusData.new_constr_plutus_data(
        slib.ConstrPlutusData.new(
            slib.BigNum.from_str("0"),
            fieldList
        )
    )

    return datumConstructor
}

module.exports = {
    mkSerializedOrderDatum,
    hashDatum
}