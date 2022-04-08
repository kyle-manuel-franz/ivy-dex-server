const blockfrost = require('./interface')

const getTransactionDetails = async tx_hash => {
    const response = await blockfrost.get(`/txs/${tx_hash}`)
    return response.data
}

module.exports = getTransactionDetails