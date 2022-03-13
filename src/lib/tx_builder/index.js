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

    Cancel Order


    Take Order
 */

const getUnitFromValueParts = (tokenName, tokenCurrencySymbol) => {
    if(tokenName === "" && tokenCurrencySymbol === "") return "lovelace"

    // todo: ensure this is correctly formatted for blockchain
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

const sumUtxosAmounts = utxos => {
    const totals = {}
    for(let i = 0; i < utxos.length; i++){
        const utxo = utxos[i]
        for(let a = 0; a < utxo.amount.length; a++){
            const amt = utxo.amount[a]
            if(totals[amt.unit]) totals[amt.unit] += parseInt(amt.quantity)
            else totals[amt.unit] = parseInt(amt.quantity)
        }
    }

    return totals
}

const valuesDifference = (val1, val2) => {
    const keys = _.uniq([...Object.keys(val1), ...Object.keys(val2)])

    const diff = {}
    for(let k = 0; k < keys.length; k++){
        const key = keys[k]

        const v1 = val1[key] || 0
        const v2 = val2[key] || 0

        diff[key] = (v1 - v2).toString()
    }

    return diff
}

const createTxOutputForPlaceOrderDatum = orderDatum => {
    const datum_hash = hashDatum(orderDatum)

    return new txOutModel({
        address: SCRIPT_ADDRESS,
        amount: [{
            unit: getUnitFromValueParts(
                orderDatum.odSellerTokenName,
                orderDatum.odSellerCurrencySymbol
            ),
            quantity: orderDatum.odSellerTokenAmount
        }],
        data_hash: datum_hash
    })
}

const createRemainderTxOutForOutputs = (txOuts, spendingUtxos) => {
    const address = spendingUtxos[0].address

    const totalValuesIn = sumUtxosAmounts(spendingUtxos)
    const totalValuesOut = sumUtxosAmounts(txOuts)

    const remainderOut = valuesDifference(totalValuesIn, totalValuesOut)
    const remainderAmounts = _.reduce(remainderOut, (acc, v, k) => [...acc, {unit: k, quantity: v}] , [] )

    return new txOutModel({
        address,
        amount: remainderAmounts
    })
}

module.exports = {
    getSpendingUtxosForAmount,
    createTxOutputForPlaceOrderDatum,
    createRemainderTxOutForOutputs,
    sumUxtosForUnit
}
