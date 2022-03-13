const blockfrost = require('./interface')

const getUtxosForAddress = async address => {
    const response = await blockfrost.get(`/addresses/${address}/utxos`)
    return response.data
}

module.exports = getUtxosForAddress