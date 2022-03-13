const Builder = require('./index')
const { createMockUtxo } = require('../../data/utxos/mock')
const { getRandomShaHash } = require('../utils')

const config = require('config')
const network = require('../network')
const SCRIPT_ADDRESS = config.scriptAddress[network]

const getMockLovelace = () => {
    return {
        tokenName: '',
        tokenCurrencySymbol: '',
        tokenAmount: 10000
    }
}
const getMockValue = () => {
    return {
        tokenName: 'ABC',
        tokenCurrencySymbol: getRandomShaHash(),
        tokenAmount: 10000
    }
}

test('getSpendingUtxos find utxos to cover specified lovelace amount', () => {
    const address = "39a7a284c2a0948189dc45dec670211cd4d72f7b66c5726c08d9b3df11e44d58"
    const utxos = []

    for(let i = 0; i < 10; i++){
        const amount = [{
            unit: "lovelace",
            quantity: "10000"
        }]
        const utxo = createMockUtxo({address, amount})
        utxos.push(utxo)
    }

    const spendingUtxos = Builder.getSpendingUtxosForAmount(utxos, 22000, "lovelace", 1000)

    expect(spendingUtxos.length).toBe(3)
    expect(Builder.sumUxtosForUnit(spendingUtxos, "lovelace")).toBeGreaterThanOrEqual(22000 + 1000)
})

test('getSpendingUtxos find utxos to cover specified token name amount', () => {
    const address = "39a7a284c2a0948189dc45dec670211cd4d72f7b66c5726c08d9b3df11e44d58"
    const utxos = []
    const token_name = getRandomShaHash()

    for(let i = 0; i < 10; i++){
        const amount = [
            {
                unit: "lovelace",
                quantity: "10000"
            },
            {
                unit: token_name,
                quantity: "10000"
            }
        ]
        const utxo = createMockUtxo({address, amount})
        utxos.push(utxo)
    }

    const spendingUtxos = Builder.getSpendingUtxosForAmount(utxos, 22000, token_name, 1000)
    expect(Builder.sumUxtosForUnit(spendingUtxos, token_name)).toBeGreaterThanOrEqual(22000 + 1000)
})

test("getSpendingUtxos throws error if it cannot find UTXOs to cover specified amount", () => {
    const address = "39a7a284c2a0948189dc45dec670211cd4d72f7b66c5726c08d9b3df11e44d58"
    const utxos = []

    for(let i = 0; i < 10; i++){
        const amount = [{
            unit: "lovelace",
            quantity: "10000"
        }]
        const utxo = createMockUtxo({address, amount})
        utxos.push(utxo)
    }
    expect(() => {
        Builder.getSpendingUtxosForAmount(utxos, 220000, "lovelace", 1000)
    }).toThrow("Could not find UTXOs to cover specified amounts")
})

test("createOutputUtxosForPlaceOrderDatum builds proper place order simple lovelace case output utxos", () => {
    const bookAddress = getRandomShaHash()
    const ownerAddress = getRandomShaHash()

    const buyerValue = getMockLovelace()
    const sellerValue = getMockLovelace()

    const orderDatum = {
        odOwner: ownerAddress,
        odBook: bookAddress,

        odBuyerTokenName: buyerValue.tokenName,
        odBuyerCurrencySymbol: buyerValue.tokenCurrencySymbol,
        odBuyerTokenAmount: buyerValue.tokenAmount.toString(),

        odSellerTokenName: sellerValue.tokenName,
        odSellerCurrencySymbol: sellerValue.tokenCurrencySymbol,
        odSellerTokenAmount: sellerValue.tokenAmount.toString()
    }

    const outputUtxo = Builder.createTxOutputForPlaceOrderDatum(orderDatum)
    expect(outputUtxo.amount[0].quantity).toBe(orderDatum.odSellerTokenAmount)
    expect(outputUtxo.amount[0].unit).toBe("lovelace")
    expect(outputUtxo.address).toBe(SCRIPT_ADDRESS)
})