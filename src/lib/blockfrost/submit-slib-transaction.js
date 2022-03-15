const blockfrost = require('./interface')
const { Buffer } = require('buffer')

const submitSlibTx = transaction => {
    const raw = Buffer.from(
        transaction.to_bytes(),
        'hex'
    ).toString('hex')

    return blockfrost.post('/tx/submit', Buffer.from(raw, 'hex'), {
        headers: {
            'Content-Type': 'application/cbor'
        },
    })
}

module.exports = submitSlibTx