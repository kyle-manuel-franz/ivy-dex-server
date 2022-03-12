const utxoModel = require('../model')
const crypto = require('crypto')

const getRandomShaHash = () => crypto.createHash('sha256').update((new Date()).toISOString()).digest('hex')

const createMockUtxo = ({ address, tx_hash, output_index, block, data_hash, amount }) => {
    return new utxoModel({
        address: address || getRandomShaHash(),
        tx_hash: tx_hash || getRandomShaHash(),
        output_index: output_index || 0,
        amount: amount || [{ unit: "lovelace", quantity: "10000"}],
        block: block || getRandomShaHash(),
        data_hash: data_hash || getRandomShaHash()
    })
}

const createMockUtxos = () => {

}

module.exports = {
    createMockUtxo
}