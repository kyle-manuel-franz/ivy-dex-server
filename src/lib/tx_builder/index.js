const _ = require('lodash')

/*
    We need to be able to balance / create transactions that satisfy the smart contract
 */

/*
    Three Different Types of Transactions:

    Place Order


    Cancel Order


    Take Order

 */

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

module.exports = {
    getSpendingUtxosForAmount,
    sumUxtosForUnit
}
