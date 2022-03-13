const axios = require('axios')
const config = require('config')
const network = require('../network')

const blockfrost = axios.create({
    baseURL: config.blockfrost[network].baseUrl,
    timeout: 10 * 1000, // 10 seconds
    headers: {'project_id': config.blockfrost[network].apiKey}
})

module.exports = blockfrost