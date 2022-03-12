const Builder = require('./index')
const { createMockUtxo } = require('../../data/utxos/mock')

test('creates a mock utxo with address', () => {
    const utxo = createMockUtxo({address: "39a7a284c2a0948189dc45dec670211cd4d72f7b66c5726c08d9b3df11e44d58"})

    expect(utxo.address).toBe("39a7a284c2a0948189dc45dec670211cd4d72f7b66c5726c08d9b3df11e44d58")
})

