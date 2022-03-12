const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")
const toHex = (bytes) => Buffer.from(bytes).toString("hex");
const fromHex = (hex) => Buffer.from(hex, "hex");

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
    mkSerializedOrderDatum
}