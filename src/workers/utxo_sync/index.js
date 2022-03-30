const Queue = require('bull')
const { getUtxosForAddress, getMetadataForTransaction } = require('../../lib/blockfrost')
const syncQueue = new Queue('sync_queue', 'redis://127.0.0.1:6379')
const _ = require('lodash')
const orderModel = require('../../data/order/model')
const { initializeMongoDbConnection } = require('../../lib/mongoose')
const { Buffer } = require('buffer')

initializeMongoDbConnection()

const ADDRESS_LABEL = '406'
const DATUM_LABEL = '405'

const trim = (str, n=2) => {
    return str.substring(n, str.length)
}

syncQueue.process(async (job, done) => {
    const utxos = await getUtxosForAddress('addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456')

    // looks for UTXOs that exist on the ledger, but don't exist on our database
    for(let i = 0; i < utxos.length; i++){
        const tx_hash = utxos[i].tx_hash
        const metadata = await getMetadataForTransaction(tx_hash)

        const addressMetadata = _.find(metadata, m => m.label === ADDRESS_LABEL)
        const datumMetadata = _.find(metadata, m => m.label === DATUM_LABEL)

        const { json_metadata:datumJSON } = datumMetadata
        const { json_metadata:addressJSON } = addressMetadata

        const { address } = addressJSON

        const buyerTokenName = Buffer.from(trim(datumJSON['3']), 'hex').toString()
        const buyerCurrencySymbol = Buffer.from(trim(datumJSON['4']), 'hex').toString()
        const buyerAmount = Buffer.from(trim(datumJSON['5']), 'hex').toString()

        const sellerTokenName = Buffer.from(trim(datumJSON['6']), 'hex').toString()
        const sellerCurrencySymbol = Buffer.from(trim(datumJSON['7']), 'hex').toString()
        const sellerAmount = Buffer.from(trim(datumJSON['8']), 'hex').toString()

        const buyerValue = {
            name: buyerTokenName,
            currencySymbol: buyerCurrencySymbol,
            amount: buyerAmount
        }

        const sellerValue = {
            name: sellerTokenName,
            currencySymbol: sellerCurrencySymbol,
            amount: sellerAmount
        }

        const order = new orderModel({
            ownerPubKeyHash: Buffer.from(trim(address, 4), 'hex').toString('hex'),
            buyerValue,
            sellerValue,

            txHash: tx_hash,

            status: 'OPEN',
            scriptAddress: 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456',
            utxo: utxos[i]
        })

        try {
            await order.save()
        } catch (e){
            console.error(e)
        }
    }

    // Look for utxos that have open status, that don't exist on the ledger (move to closed state)

    done()
})