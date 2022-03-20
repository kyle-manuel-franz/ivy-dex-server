const blockfrost = require('./interface')

const getDatumFromDatumHash = async datum_hash => {
    const response = await blockfrost.get(`/scripts/datum/${datum_hash}`)
    return response.data
}

module.exports = getDatumFromDatumHash