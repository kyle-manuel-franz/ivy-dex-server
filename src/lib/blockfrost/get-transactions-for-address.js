const blockfrost = require('./interface')

const getTransactionsForAddress = async (address, page=1) => {
    const response = await blockfrost.get(`/addresses/${address}/transactions?page=${page}`)
    return response.data
}

module.exports = getTransactionsForAddress