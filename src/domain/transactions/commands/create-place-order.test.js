const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require('buffer')
const toHex = (bytes) => Buffer.from(bytes).toString("hex");

const {
    createPartialPlaceOrderTransaction
} = require('./index')

const {
    OTHELLO_ADDRESS,
    SCRIPT_ADDRESS
} = require('../../../../env/data/addresses')

const {
    OTHELLO_TOKEN
} = require('../../../../env/data/tokens')

const convertValueToJson = value => {
    const amounts = []
    amounts.push({
        unit: 'lovelace',
        quantity: value.coin().to_str()
    })

    if(value.multiasset()){
        const multiAsset = value.multiasset()
        for(let i = 0; i < multiAsset.keys().len(); i++){
            const scriptHash = multiAsset.keys().get(i)
            const policyId = Buffer.from(scriptHash.to_bytes()).toString('hex')
            const assets = multiAsset.get(scriptHash)
            for(let a = 0; a < assets.keys().len(); a++){
                const assetName = assets.keys().get(a)
                const assetNameUtf = Buffer.from(assetName.name()).toString()

                const amount = assets.get(assetName)
                amounts.push({
                    unit: `${policyId}${assetNameUtf}`,
                    amount: amount.to_str()
                })
            }
        }
    }

    return amounts
}

test('creates a partial tx for place order with native asset', async () => {
    const ownerAddress = slib.Address.from_bech32(OTHELLO_ADDRESS)
    const odOwnerPubKeyHash = Buffer.from(slib.BaseAddress.from_address(ownerAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const bookAddress = slib.Address.from_bech32(SCRIPT_ADDRESS)
    const odBookPubKeyHash = Buffer.from(slib.BaseAddress.from_address(bookAddress).payment_cred().to_keyhash().to_bytes()).toString('hex')

    const orderDatum = {
        odOwner: odOwnerPubKeyHash,
        odBook: odBookPubKeyHash,

        odBuyerTokenName: OTHELLO_TOKEN.tokenName,
        odBuyerCurrencySymbol: OTHELLO_TOKEN.policyId,
        odBuyerTokenAmount: '10000',

        odSellerTokenName: '',
        odSellerCurrencySymbol: '',
        odSellerTokenAmount: '1000000'
    }
    const txBuilder = await createPartialPlaceOrderTransaction(orderDatum, SCRIPT_ADDRESS)
})