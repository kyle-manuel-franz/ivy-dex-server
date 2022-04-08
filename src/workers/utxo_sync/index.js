const Queue = require('bull')
const { getUtxosForAddress, getMetadataForTransaction, getUtxosForTx } = require('../../lib/blockfrost')
const syncQueue = new Queue('sync_queue', 'redis://127.0.0.1:6379')
const _ = require('lodash')
const orderModel = require('../../data/order/model')
const { initializeMongoDbConnection } = require('../../lib/mongoose')
const { Buffer } = require('buffer')

const db = initializeMongoDbConnection()

const ADDRESS_LABEL = '406'
const DATUM_LABEL = '405'

const trim = (str, n=2) => {
    return str.substring(n, str.length)
}

// TODO: add the taker utxos and fees if the taker fees or maker fees are missing
const synchronizeFeesToOrders = async () => {

}

// Look for the correct tx if there is a missing taker tx hash
const upsertTakerTxHash = async () => {

}

const MAX_SYNC_ATTEMPTS = 100;

const updatePendingTransactions = async () => {
    const pending_txs = await orderModel.find({ utxo: null })
    const hashes = _.map(pending_txs, 'txHash')
    let unsynced = 0

    for(let j = 0; j < hashes.length; j++){
        const pending_tx = pending_txs[j]
        pending_tx.syncAttempts = _.isUndefined(pending_tx.syncAttempts) ? 0 : (pending_tx.syncAttempts + 1)
        await pending_tx.save()

        if(pending_tx.syncAttempts > MAX_SYNC_ATTEMPTS) {
            continue
        }

        const tx_hash = hashes[j]
        let utxosForHash
        try {
            utxosForHash = await getUtxosForTx(tx_hash)
        } catch (e){
            console.log('No transaction for tx_hash, please wait longer')
            unsynced += 1
            continue
        }
        const outputs = utxosForHash.outputs
        for(let i = 0; i < outputs.length; i++){
            const utxo = outputs[i]
            if(utxo.address !== 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456') continue;

            utxo.tx_hash = tx_hash
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

            const existing_order = await orderModel.findOne({ txHash: tx_hash })
            if(!existing_order){
                const order = new orderModel({
                    ownerPubKeyHash: Buffer.from(trim(address, 4), 'hex').toString('hex'),
                    buyerValue,
                    sellerValue,

                    txHash: tx_hash,

                    status: 'OPEN',
                    scriptAddress: 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456',
                    utxo
                })

                try {
                    await order.save()
                } catch (e){
                    console.error(e)
                }
            } else {
                existing_order.utxo = utxo
                existing_order.scriptAddress = 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456'

                try {
                    await existing_order.save()
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }

    console.log(`Remaining unsynced: ${unsynced}`)
    // if there are more utxos to sync, run the job again with a 5 second delay
    if(unsynced !== 0){
        syncQueue.add({ name: 'sync_pending' }, { delay: 5000 } )
    }
}

const syncSingleTransaction = async tx_hash => {
    let utxosForHash
    try {
        utxosForHash = await getUtxosForTx(tx_hash)
    } catch (e){
        console.log('No transaction for tx_hash, please wait longer')
        return
    }
    const outputs = utxosForHash.outputs

    for(let i = 0; i < outputs.length; i++){
        const utxo = outputs[i]
        if(utxo.address !== 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456') continue;

        utxo.tx_hash = tx_hash
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

        const existing_order = await orderModel.findOne({ txHash: tx_hash })
        if(!existing_order){
            const order = new orderModel({
                ownerPubKeyHash: Buffer.from(trim(address, 4), 'hex').toString('hex'),
                buyerValue,
                sellerValue,

                txHash: tx_hash,

                status: 'OPEN',
                scriptAddress: 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456',
                utxo
            })

            try {
                await order.save()
            } catch (e){
                console.error(e)
            }
        } else {
            existing_order.utxo = utxo
            existing_order.scriptAddress = 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456'

            try {
                await existing_order.save()
            } catch (e) {
                console.error(e)
            }
        }
    }

}

syncQueue.process(async (job, done) => {
    console.log("Syncing Ledger with Database")

    if(job.data.tx_hash){
        await syncSingleTransaction(job.data.tx_hash)
        return done()
    } else if(job.data.name === 'sync_pending') {
        await updatePendingTransactions()
        return done()
    }

    let utxos
    try {
        utxos = await getUtxosForAddress('addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456')
    } catch(e){
        done()
    }

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

        const existing_order = await orderModel.findOne({ txHash: tx_hash })
        if(!existing_order){
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
        } else {
            existing_order.utxo = utxos[i]
            existing_order.scriptAddress = 'addr_test1wqj8js8x3jw7cjqlgrsetcp7v80jxsqyyjk3hcer9l9f8rsvk7456'

            try {
                await existing_order.save()
            } catch (e) {
                console.error(e)
            }
        }
    }

    return done()
})