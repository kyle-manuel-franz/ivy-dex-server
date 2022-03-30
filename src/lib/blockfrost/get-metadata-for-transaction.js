const blockfrost = require('./interface')

const getMetadataForTransaction = async tx_hash => {
    const response = await blockfrost.get(`/txs/${tx_hash}/metadata`)
    return response.data
}

module.exports = getMetadataForTransaction