const blockfrost = require('./interface')
const { Buffer } = require('buffer')

const submitTx = transaction => {
    return blockfrost.post('/tx/submit', Buffer.from(transaction, 'hex'), {
        headers: {
            'Content-Type': 'application/cbor'
        },
    })
}

module.exports = submitTx