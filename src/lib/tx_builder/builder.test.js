const Builder = require('./index')
const { createMockUtxo } = require('../../data/utxos/mock')

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
    expect(Builder.sumUxtosForUnit(utxos, "lovelace")).toBeGreaterThanOrEqual(22000 + 1000)
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