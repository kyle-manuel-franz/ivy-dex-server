const { mnemonicToEntropy } = require('bip39')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require('buffer')

const blockfrost = require('../src/lib/blockfrost')

const harden = num => {
    return 0x80000000 + num;
}

const entropy = mnemonicToEntropy(
    "captain answer wife trial sell render energy describe cart design valid amateur layer clown eight"
)

const rootKey = slib.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from('')
)

const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(0))

const utxoPubKey = accountKey
    .derive(0) // external
    .derive(0)
    .to_public();

const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0)
    .to_public();

const baseAddress = slib.BaseAddress.new(
    slib.NetworkInfo.testnet().network_id(),
    slib.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    slib.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
);

const mkTxBuilderConfig = pp => {
    return slib.TransactionBuilderConfigBuilder.new()
        .coins_per_utxo_word(
            slib.BigNum.from_str(pp.coinsPerUtxoWord)
        )
        .fee_algo(
            slib.LinearFee.new(
                slib.BigNum.from_str(pp.linearFee.minFeeA),
                slib.BigNum.from_str(pp.linearFee.minFeeB)
            )
        )
        .key_deposit(slib.BigNum.from_str(pp.keyDeposit))
        .pool_deposit(
            slib.BigNum.from_str(pp.poolDeposit)
        )
        .max_tx_size(pp.maxTxSize)
        .max_value_size(pp.maxValSize)
        .prefer_pure_change(true)
        .build()
}

(async () => {
    const bech32_address = baseAddress.to_address().to_bech32()
    // const info = await blockfrost.getSpecificAddress(bech32_address)
    const pp = await blockfrost.fetchProtocolParameters()
    const txBuilderConfig = mkTxBuilderConfig(pp)

    const utxosAtAddress = await blockfrost.getUtxosForAddress(bech32_address)
    console.log(utxosAtAddress)

})()
