const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require("buffer")
const toHex = (bytes) => Buffer.from(bytes).toString("hex");
const fromHex = (hex) => Buffer.from(hex, "hex");

// TODO: finish this up and verify the values are equal to what is in the
// smart contract cardano-cli hash script datum from json file

const mkSerializedOrderDatum = (
    odOwner,
    odBook,
    odBuyerValueTokenName,
    odBuyerValueTokenAmount,
    odBuyerValueCurrencySymbol,
    odSellerValueTokenName,
    odSellerValueTokenAmount,
    odSellerValueCurrencySymbol
) => {

    const fieldList = slib.PlutusList.new()
    fieldList.add(toHex(odOwner))
    fieldList.add(toHex(odBook))


}