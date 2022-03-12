const crypto = require('crypto')

const getRandomShaHash = () => crypto.createHash('sha256').update((new Date()).toISOString()).digest('hex')


module.exports = {
    getRandomShaHash
}