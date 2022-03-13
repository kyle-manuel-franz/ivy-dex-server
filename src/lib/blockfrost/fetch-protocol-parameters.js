const blockfrost = require('./interface')

const fetchProtocolParameters = async () => {
    const response = await blockfrost.get('/blocks/latest')
    const latestBlock = response.data
    const response2 = await blockfrost.get(`/epochs/${latestBlock.epoch}/parameters`)
    const p = response2.data
    return {
        linearFee: {
            minFeeA: p.min_fee_a.toString(),
            minFeeB: p.min_fee_b.toString(),
        },
        minUtxo: '1000000',
        poolDeposit: p.pool_deposit,
        keyDeposit: p.key_deposit,
        coinsPerUtxoWord: '34482',
        maxValSize: 5000,
        priceMem: 5.77e-2,
        priceStep: 7.21e-5,
        maxTxSize: parseInt(p.max_tx_size),
        slot: parseInt(latestBlock.slot),
    }
}

module.exports = fetchProtocolParameters