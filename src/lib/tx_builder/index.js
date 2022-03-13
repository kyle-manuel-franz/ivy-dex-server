const _ = require('lodash')
const config = require('config')
const network = require('../network')

const txOutModel = require('../../data/txOut/model')

const { hashDatum } = require('../ledger')

const SCRIPT_ADDRESS = config.scriptAddress[network]

/*
    We need to be able to balance / create transactions that satisfy the smart contract
 */

/*
    Three Different Types of Transactions:

    Place Order


    Cancel Order


    Take Order

 */

const getUnitFromValueParts = (tokenName, tokenCurrencySymbol) => {
    if(tokenName === "" && tokenCurrencySymbol === "") return "lovelace"

    // todo: hash this correctly to get it ready for blockchain
    return tokenCurrencySymbol + tokenName
}

// get a set of utxos that total at least the amount specified
const getSpendingUtxosForAmount = (utxos, amount, unit = "lovelace", estimatedFees) => {
    const spendingUtxos = []
    let sum = 0

    for(let i = 0; i < utxos.length; i++){
        spendingUtxos.push(utxos[i])
        const value = utxos[i].amount.find(a => a.unit === unit)
        sum += parseInt(value.quantity)
        if(sum >= amount + estimatedFees){
            return spendingUtxos
        }
    }

    throw new Error("Could not find UTXOs to cover specified amounts")
}

const sumUxtosForUnit = (utxos, unit = "lovelace") => {
    let sum = 0
    for(let i = 0; i < utxos.length; i++){
        const value = utxos[i].amount.find(a => a.unit === unit)
        sum += parseInt(value.quantity)
    }

    return sum
}

const createTxOutputsForPlaceOrderDatum = orderDatum => {
    const txOuts = []
    // Need to construct utxo with output to script address of seller value
    // Also need to place change in another UTXO with left over value
    const {
        odOwner,
        odSellerTokenName,
        odSellerCurrencySymbol,
        odSellerTokenAmount
    } = orderDatum

    const datum_hash = hashDatum(orderDatum)

    // txOut that locks funds in the script address
    const txOutScript = new txOutModel({
        address: SCRIPT_ADDRESS,
        amount: [{
            unit: getUnitFromValueParts(odSellerTokenName, odSellerCurrencySymbol),
            quantity: odSellerTokenAmount
        }],
        data_hash: datum_hash
    })

    txOuts.push(txOutScript)




    return txOuts
}

module.exports = {
    getSpendingUtxosForAmount,
    createTxOutputsForPlaceOrderDatum,
    sumUxtosForUnit
}
