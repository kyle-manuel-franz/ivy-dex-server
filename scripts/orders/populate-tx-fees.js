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

(async () => {
    const connection = await createNewMongoDbConnection();
    const orderModel = connection.model('order', orderSchema)

    try{
        const missingTakerTxFees = await orderModel.find({
            status: 'CLOSED',
            takerTxHash: { $ne: null },
            takerFee: null
        })

        const missingMakerTxFees = await orderModel.find({
            txHash: { $ne: null },
            makerFee: null
        })

        for(let i = 0; i < missingTakerTxFees.length; i++) {
            const order = missingTakerTxFees[i]

            const tx = await blockfrost.getTransactionDetails(order.takerTxHash)
            console.log(tx.fees)

            order.takerFee = tx.fees
            await order.save()
        }

        for(let i = 0; i < missingMakerTxFees.length; i++) {
            const order = missingMakerTxFees[i]

            const tx = await blockfrost.getTransactionDetails(order.txHash)
            console.log('maker fee:', tx.fees)

            order.makerFee = tx.fees
            await order.save()
        }

        await connection.close()
    } catch (e){
        console.error(e)
    }
})();