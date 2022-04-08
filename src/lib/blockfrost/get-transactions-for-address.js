const blockfrost = require('./interface')

const getTransactionsForAddress = async address => {
    const response = await blockfrost.get(`/addresses/${address}/transactions`)
    return response.data
}

module.exports = getTransactionsForAddress