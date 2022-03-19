const blockfrost = require('../../../lib/blockfrost')
const {
    mkTxBuilder
} = require('../../../lib/slib')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require('buffer')
const {
    hashDatum
} = require('../../../lib/ledger')

const makeValueForNativeToken = (
    tokenName,
    policyId,
    amount
) => {
    const assetName = slib.AssetName.new(Buffer.from(tokenName))
    const multiAsset = slib.MultiAsset.new()
    const assets = slib.Assets.new()
    assets.insert(assetName, slib.BigNum.from_str(amount))

    const tokenScriptHash = slib.ScriptHash.from_bytes(Buffer.from(policyId, "hex"))
    multiAsset.insert(tokenScriptHash, assets)

    return slib.Value.new_from_assets(multiAsset)
}

const createPartialPlaceOrderTransaction = async (orderDatum, script_address) => {
    const pp = await blockfrost.fetchProtocolParameters()
    const txBuilder = mkTxBuilder(pp)

    const datum_hash = hashDatum(orderDatum)

    let buyerValue
    if(orderDatum.odBuyerCurrencySymbol === ''){
        buyerValue = slib.Value.new(slib.BigNum.from_str(orderDatum.odBuyerTokenAmount))
    } else {
        buyerValue = makeValueForNativeToken(
            orderDatum.odBuyerTokenName,
            orderDatum.odBuyerCurrencySymbol,
            orderDatum.odBuyerTokenAmount
        )

        const min_ada = slib.min_ada_required(buyerValue, true, slib.BigNum.from_str(pp.coinsPerUtxoWord))
        const lovelaceValue = slib.Value.new(min_ada)

        buyerValue = buyerValue.checked_add(lovelaceValue)
    }

    const scriptOutput = slib.TransactionOutput.new(
        slib.Address.from_bech32(script_address),
        buyerValue
    )

    scriptOutput.set_data_hash(datum_hash)

    txBuilder.add_output(
        scriptOutput
    )

    return txBuilder
}

module.exports = {
    createPartialPlaceOrderTransaction
}