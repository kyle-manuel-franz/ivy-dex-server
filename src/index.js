const express = require('express')
const config = require('config')
const port = config.port
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
// TODO: turn this off in production
const cors = require('cors');
const { Buffer } = require('buffer')
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')
const _ = require('lodash')

const {
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
        buyerTokenName = buyerAsset.substring(56, buyerAsset.length)
    }

    let sellerCurrencySymbol, sellerTokenName
    if(sellerAsset === ''){
        sellerCurrencySymbol = ''
        sellerTokenName = ''
    } else {
        sellerCurrencySymbol = buyerAsset.substring(0, 56)
        sellerTokenName = buyerAsset.substring(56, buyerAsset.length)
    }

    const ownerAddress = slib.Address.from_bytes(Buffer.from(ownerAddressRaw, 'hex'))
    const ownerPubKeyHash = Buffer.from(slib.BaseAddress.from_address(ownerAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const bookAddress = slib.Address.from_bech32(SCRIPT_ADDRESS)
    const odBookPubKeyHash = Buffer.from(slib.BaseAddress.from_address(bookAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const outputs = await createOutputsForPlaceOrder({
        odOwner: ownerPubKeyHash,
        odBook: odBookPubKeyHash,

        odBuyerTokenName: buyerTokenName,
        odBuyerCurrencySymbol: buyerCurrencySymbol,
        odBuyerTokenAmount: buyerAmount,

        odSellerTokenName: sellerTokenName,
        odSellerCurrencySymbol: sellerCurrencySymbol,
        odSellerTokenAmount: sellerAmount
    }, SCRIPT_ADDRESS)

    res.status(200)
    res.send(_.map(outputs, o => Buffer.from(o).toString('hex')))
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