const express = require('express')
const config = require('config')
const port = config.port
// TODO: turn this off in production
const cors = require('cors');
const morgan = require('morgan')
const tokenModel = require('./data/tokens/model')
const orderModel = require('./data/order/model')

const { initializeMongoDbConnection } = require('./lib/mongoose')
const _ = require('lodash')

const Queue = require('bull')
const syncQueue = new Queue('sync_queue', 'redis://127.0.0.1:6379')

const app = express()
app.use(cors())
app.use(morgan('common'))
app.use(express.json())
initializeMongoDbConnection().then()

app.get('/api/tokens', async (req, res, next) => {
    const tokens = await tokenModel.find()

    res.send(JSON.stringify(tokens))
})

app.get('/api/sync/:tx_hash', async (req, res, next) => {
    const { tx_hash } = req.params
    syncQueue.add({ tx_hash })
    res.status(200)
    res.send()
})

// TODO: move this to a separate router and handler with validation and what not
app.post('/api/datum', async (req, res, next) => {
    const { data: { buyerValue, sellerValue, ownerPubKeyHash, ownerAddress, txHash }} = req.body

    const order = new orderModel({
        buyerValue,
        sellerValue,
        ownerAddress,
        ownerPubKeyHash,
        txHash,
        status: "OPEN"
    })

    await order.save()
    res.send('OK')
})

// This end point should update the open UTXOs as spend for the purposes of the UI
// If the order fails, this will update back from CLOSED to OPEN
// I'll have another job for that
app.post('/api/datum/:id/spend', async (req, rex, next) => {
    const { id } = req.params
})

app.get('/api/orders/:currencySymbol/:tokenName', async (req, res, next) => {
    const { currencySymbol, tokenName } = req.params
    const orders = await orderModel.find({
        $or: [
            {
                'buyerValue.name': tokenName,
                'buyerValue.currencySymbol': currencySymbol,
                status: 'OPEN'
            },
            {
                'sellerValue.name': tokenName,
                'sellerValue.currencySymbol': currencySymbol,
                status: 'OPEN'
            }
        ]
    })
    syncQueue.add({ name: 'sync_pending' })
    res.send(orders)
})

app.get('/api/orders/:paymentPubKeyHash', async (req, res, next) => {
    const { paymentPubKeyHash } = req.params
    const orders = await orderModel.find({
        ownerPubKeyHash: { $regex: new RegExp(`^${paymentPubKeyHash}`)}
    })

    res.send(orders)
})

app.post('/api/orders/:tx_hash', async (req, res, next) => {
    const { tx_hash } = req.params
    const { taker_address } = req.body
    const order = await orderModel.findOne({ txHash: tx_hash })

    order.takerAddress = taker_address
    order.status = 'CLOSED'
    order.closedAt = new Date()
    await order.save()

    res.status(200)
    res.send()
})

app.get('/api/tokens/prices', async (req, res, next) => {
    const sellingOrders = await orderModel.aggregate(
        [
            {
                $match: {
                    status: 'OPEN',
                    'buyerValue.name': { $ne: ''}
                }
            },
            {
                $group: {
                    _id: "$buyerValue.name",
                    ask_count: { $count: {}},
                    ask: {
                        $min: {
                            $divide: ["$sellerValue.amount", "$buyerValue.amount"] }
                    }
                }
            }
        ]
    )

    const buyingOrders = await orderModel.aggregate(
        [
            {
                $match: {
                    status: 'OPEN',
                    'sellerValue.name': { $ne: ''}
                }
            },
            {
                $group: {
                    _id: "$sellerValue.name",
                    bid_count: {
                        $count: {}},
                    bid: {
                        $max: {
                            $divide: ["$buyerValue.amount", "$sellerValue.amount"]
                        }
                    }
                }
            }
        ]
    )

    const lastBuyOrders = await orderModel.aggregate(
        [
            {
                $match: {
                    status: 'CLOSED',
                    'sellerValue.name': { $ne: ''}
                }
            },
            {
                $sort: { "closedAt": -1}
            },
            {
                $group: {
                    _id: "$sellerValue.name",
                    lastBuyClosed: { $first: '$closedAt'},
                    lastBuyAmount: {
                        $first: {
                            $divide: ["$buyerValue.amount", "$sellerValue.amount"]
                        }
                    }
                }
            }
        ]
    )

    const lastSellOrders = await orderModel.aggregate(
        [
            {
                $match: { status: 'CLOSED', 'buyerValue.name': { $ne: ''} }
            },
            {
                $sort: { "closedAt": -1}
            },
            {
                $group: {
                    _id: "$buyerValue.name",
                    lastSellClosed: {$first: '$closedAt'},
                    lastSellAmount: {
                        $first: {
                            $divide: ["$sellerValue.amount", "$buyerValue.amount"]
                        }
                    }
                }
            }
        ]
    )

    const buyer24Vol = await orderModel.aggregate([
        {
            $match: {
                status: 'CLOSED',
                closedAt: {
                    $lt: new Date(),
                    $gte: new Date(new Date().setDate(new Date().getDate() - 1))
                },
                'buyerValue.name': {$ne: ''}
            }
        },
        {
            $group: {
                _id: "$buyerValue.name",
                buyCount24: { $count: {}}
            }
        },
    ])

    const seller24Vol = await orderModel.aggregate([
        {
            $match: {
                status: 'CLOSED',
                closedAt: {
                    $lt: new Date(),
                    $gte: new Date(new Date().setDate(new Date().getDate() - 1))
                },
                'sellerValue.name': {$ne: ''}
            }
        },
        {
            $group: {
                _id: "$sellerValue.name",
                sellCount24: { $count: {}}
            }
        },
    ])

    const prices = {}
    _.each([sellingOrders, buyingOrders, lastBuyOrders, lastSellOrders, buyer24Vol, seller24Vol], arr => {
        _.each(arr, order => {
            prices[order._id] = {
                ...prices[order._id],
                ..._.omit(order, '_id')
            }
        })
    })

    _.each(_.entries(prices), ([k, price]) => {
        const lastBuyAt = _.get(price, 'lastBuyClosed', 0)
        const lastSellAt = _.get(price, 'lastSellClosed', 0)

        const lastBuyAmount = _.get(price, 'lastBuyAmount', 0)
        const lastSellAmount = _.get(price, 'lastSellAmount', 0)

        const last = new Date(lastBuyAt) > new Date(lastSellAt) ? lastBuyAmount || 0 : lastSellAmount || 0
        prices[k].last = last
    })

    res.send(prices)
})

app.get('/api', async (req, res, next) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})