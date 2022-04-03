const blockfrost = require('./interface')

const getUtxosForTx = async tx_hash => {
    const response = await blockfrost.get(`/txs/${tx_hash}/utxos`)
    return response.data
}

module.exports = getUtxosForTx