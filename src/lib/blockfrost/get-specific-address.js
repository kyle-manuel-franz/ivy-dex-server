const blockfrost = require('./interface')

const getSpecificAddress = async address => {
    const response = await blockfrost.get(`/addresses/${address}`)
    return response.data
}

module.exports = getSpecificAddress