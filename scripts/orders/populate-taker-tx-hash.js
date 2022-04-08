#!/usr/bin/env node
/*
    This should output specific info about an address
*/
const yargs = require('yargs')
const blockfrost = require('../../src/lib/blockfrost');
const { createNewMongoDbConnection } = require('../../src/lib/mongoose')
const { Buffer } = require('buffer');
const _ = require('lodash')
const orderSchema = require('../../src/data/order/model/schema');

// const options = yargs
//     .option("d", {
//         alias: "datum_hash",
//         describe: "hash of datum",
//         required: true
//     })
//     .argv;

// implement this for paging
const getAllTransactions = async (address, txs, page=0) => {

}

(async () => {
    const connection = await createNewMongoDbConnection();
    const orderModel = connection.model('order', orderSchema)

    const utxosMap = {}

    try{
        const unpairedOrders = await orderModel.find({
            status: 'CLOSED',
            takerTxHash: null,
            takerAddress: { $ne: null }
        })

        for(let i = 0; i < unpairedOrders.length; i++){
            const order = unpairedOrders[i]
            console.log('Taker Address:', order.takerAddress)

            let transactionsForTakerAddress = utxosMap[order.takerAddress]
            if(transactionsForTakerAddress == null){
                transactionsForTakerAddress = await blockfrost.getTransactionsForAddress(order.takerAddress)

                if(transactionsForTakerAddress.length >= 100){
                    const transactionsForTakerAddress2 = await blockfrost.getTransactionsForAddress(order.takerAddress, 2)
                    transactionsForTakerAddress = [...transactionsForTakerAddress, ...transactionsForTakerAddress2]
                }

                utxosMap[order.takerAddress] = transactionsForTakerAddress
            }

            for(let t = 0; t < transactionsForTakerAddress.length; t++){
                const tx_hash = transactionsForTakerAddress[t].tx_hash

                let tx_utxos = utxosMap[tx_hash]

                if(tx_utxos == null){
                    tx_utxos = await blockfrost.getUtxosForTx(tx_hash)
                    utxosMap[tx_hash] = tx_utxos
                }

                const inputs = tx_utxos.inputs

                const match = _.find(inputs, i => i.tx_hash === order.txHash)
                if(!!match){
                    console.log('This is the Tx of the taker: ', match.tx_hash)
                    order.takerTxHash = tx_hash

                    await order.save()
                }
            }
        }

        await connection.close()
    } catch (e){
        console.error(e)
    }
})();