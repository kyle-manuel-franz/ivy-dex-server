const orderDatumModel = require('../model')
const { getRandomShaHash } = require('../../../lib/utils')

const createMockOrderDatum = ({
    odOwner,
    odBook,

    odBuyerTokenName,
    odBuyerCurrencySymbol,
    odBuyerTokenAmount,

    odSellerTokenName,
    odSellerCurrencySymbol,
    odSellerTokenAmount
}) => {
    return new orderDatumModel({
        odOwner: odOwner || getRandomShaHash(),
        odBook: odBook || getRandomShaHash(),

        odBuyerTokenName: odBuyerTokenName || 'ABC',
        odBuyerCurrencySymbol: odBuyerCurrencySymbol || getRandomShaHash(),
        odBuyerTokenAmount: odBuyerTokenAmount || 10000,

        odSellerTokenName: odSellerTokenName || 'lovelace',
        odSellerCurrencySymbol: odSellerCurrencySymbol || getRandomShaHash(),
        odSellerTokenAmount: odSellerTokenAmount || 10000
    })
}

module.exports = {
    createMockOrderDatum
}