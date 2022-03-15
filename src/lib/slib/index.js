/*
    This module should provider utils / wrappers around cardano's
    serialization lib
 */
const slib = require('@emurgo/cardano-serialization-lib-nodejs')

// TODO: we should add testing coverage to this

const harden = num => {
    return 0x80000000 + num;
}

const generateKeySet = entropy => {
    const rootKey = slib.Bip32PrivateKey.from_bip39_entropy(
        Buffer.from(entropy, 'hex'),
        Buffer.from('')
    )

    const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(0))

    const utxoPrvKey = accountKey
        .derive(0)
        .derive(0)

    const utxoPubKey = utxoPrvKey.to_public();

    console.log(Buffer.from(utxoPubKey.to_raw_key().hash().to_bytes()).toString('hex'))

    const stakeKey = accountKey
        .derive(2) // chimeric
        .derive(0)
        .to_public();

    const baseAddress = slib.BaseAddress.new(
        slib.NetworkInfo.testnet().network_id(),
        slib.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
        slib.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
    );

    return {
        rootKey,
        accountKey,
        utxoPrvKey,
        utxoPubKey,
        stakeKey,
        baseAddress
    }
}

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

const mkTxBuilder = pp => {
    const txBuilderConfig = mkTxBuilderConfig(pp)
    return slib.TransactionBuilder.new(txBuilderConfig)
}

// TODO: This needs to support multiasset values
const mkTxInput = (address, utxo) => {
    return [
        slib.Address.from_bech32(address),
        slib.TransactionInput.new(
            slib.TransactionHash.from_bytes(
                Buffer.from(utxo.tx_hash, "hex")
            ),
            utxo.output_index
        ),
        slib.Value.new(slib.BigNum.from_str(utxo.amount[0].quantity))
    ]
}

module.exports = {
    generateKeySet,
    mkTxBuilderConfig,
    mkTxBuilder,
    mkTxInput,
}