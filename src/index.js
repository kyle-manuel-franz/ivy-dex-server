const express = require('express')
const config = require('config')
const port = config.port
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
// TODO: turn this off in production
const cors = require('cors');
const { Buffer } = require('buffer')
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')
const orderDatumModel = require('./data/orderDatum/model')
const _ = require('lodash')

const transactionRouter = require('./domain/transactions/web')
const { mkSerializedOrderDatum, hashDatum } = require('./lib/ledger')

const {
    JULIET_ADDRESS,
    SCRIPT_ADDRESS
} = require('../env/data/addresses')

const { initializeMongoDbConnection } = require('./lib/mongoose')

const { createOutputsForPlaceOrder } = require('./domain/transactions/commands')

const app = express()
app.use(cors())
app.use(morgan('common'))
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()
    res.send(JSON.stringify(tokens))
})

// TODO: move this to a separate router and handler with validation and what not
app.get('/api/tx_outputs/place_order', async (req, res, next) => {
    const ownerAddressRaw = req.query.ownerAddress
    const buyerAsset = req.query.buyerAsset
    const sellerAsset = req.query.sellerAsset
    const sellerAmount = req.query.sellerAmount
    const buyerAmount = req.query.buyerAmount

    let buyerCurrencySymbol, buyerTokenName
    if(buyerAsset === ''){
        buyerCurrencySymbol = ''
        buyerTokenName = ''
    } else {
        buyerCurrencySymbol = buyerAsset.substring(0, 56)
        buyerTokenName = Buffer.from(buyerAsset.substring(56, buyerAsset.length), "hex").toString()
    }

    let sellerCurrencySymbol, sellerTokenName
    if(sellerAsset === ''){
        sellerCurrencySymbol = ''
        sellerTokenName = ''
    } else {
        sellerCurrencySymbol = sellerAsset.substring(0, 56)
        sellerTokenName = Buffer.from(sellerAsset.substring(56, buyerAsset.length), "hex").toString()
    }

    const ownerAddress = slib.Address.from_bytes(Buffer.from(ownerAddressRaw, 'hex'))
    const ownerPubKeyHash = Buffer.from(slib.BaseAddress.from_address(ownerAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const bookAddress = slib.Address.from_bech32(JULIET_ADDRESS)
    const odBookPubKeyHash = Buffer.from(slib.BaseAddress.from_address(bookAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const orderDatum = {
        odOwner: ownerPubKeyHash,
        odBook: odBookPubKeyHash,

        odBuyerTokenName: buyerTokenName,
        odBuyerCurrencySymbol: buyerCurrencySymbol,
        odBuyerTokenAmount: buyerAmount,

        odSellerTokenName: sellerTokenName,
        odSellerCurrencySymbol: sellerCurrencySymbol,
        odSellerTokenAmount: sellerAmount
    }


    const outputs = await createOutputsForPlaceOrder(orderDatum, SCRIPT_ADDRESS)

    const orderDatumRecord = new orderDatumModel(orderDatum)
    orderDatumRecord.datum_hash = Buffer.from(hashDatum(orderDatum).to_bytes()).toString('hex')
    await orderDatumRecord.save()

    res.status(200)
    res.send({
        outputs: _.map(outputs, o => Buffer.from(o).toString('hex')),
        order_datum: orderDatum,
        order_datum_serialized: Buffer.from(mkSerializedOrderDatum(
            orderDatum.odOwner,
            orderDatum.odBook,
            orderDatum.odBuyerTokenName,
            orderDatum.odBuyerCurrencySymbol,
            orderDatum.odBuyerTokenAmount.toString(),
            orderDatum.odSellerTokenName,
            orderDatum.odSellerCurrencySymbol,
            orderDatum.odSellerTokenAmount.toString()
        ).to_bytes()).toString('hex')
    })
})

app.get('/api/tx/take_order', async (req, res, next) => {
    // build transaction for take order
    // this should just build the bytes buffer for the datum and other peices
    const ret_shape = {
        order_datum: "",
        outputs: "",
        redeemers: ""
    }
    res.status(200)
    res.send('success')
})

app.get('/api/tx/cancel_order', async (req, res, next) => {
    // build transaction for cancel order
    // this should just build the bytes buffer for the datum and other peices
    const ret_shape = {
        order_datum: "",
        outputs: "",
        redeemers: ""
    }
    res.status(200)
    res.send('success')
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})