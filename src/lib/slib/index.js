/*
    This module should provider utils / wrappers around cardano's
    serialization lib
 */
const slib = require('@emurgo/cardano-serialization-lib-nodejs')

// TODO: we should add testing coverage to this

const harden = num => {
    return 0x80000000 + num;
}

const createRootKeyFromEntropy = entropy => {
    return slib.Bip32PrivateKey.from_bip39_entropy(
        Buffer.from(entropy, 'hex'),
        Buffer.from('')
    )
}

const createAccountKeyFromRootKey = rootKey => {
    return rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(0))
}

const createPrivateKeyFromAccountKey = (accountKey, i=0, k=0) => {
    return accountKey
        .derive(i)
        .derive(k)
}

const getPublicKeyForPrivateKey = privateKey => {
    return privateKey.to_public()
}

const getHashForPubKey = publicKey => {
    return Buffer.from(publicKey.to_raw_key().hash().to_bytes()).toString('hex')
}

const getSimpleBaseAddressForAccountKey = accountKey => {
    const pubKey = accountKey
        .derive(0)
        .derive(0)
        .to_public()

    const stakeKey = accountKey
        .derive(2)
        .derive(0)
        .to_public()

    return slib.BaseAddress.new(
        slib.NetworkInfo.testnet().network_id(),
        slib.StakeCredential.from_keyhash(pubKey.to_raw_key().hash()),
        slib.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
    )
}

const generateKeySet = entropy => {
    const rootKey = createRootKeyFromEnrtopy(entropy)
    const accountKey = createAccountKeyFromRootKey(rootKey)

    const utxoPrvKey = createPrivateKeyFromAccountKey(accountKey, 0, 0)
    const utxoPubKey = getPublicKeyForPrivateKey(utxoPrvKey)

    const stakeKey = accountKey
        .derive(2) // chimeric
        .derive(0)
        .to_public();

    const baseAddress = getSimpleBaseAddressForAccountKey(accountKey)

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

/*
    Gives a policy id for a native asset that must be signed by the key to mint more
 */
const getSimpleScriptPolicyForPublicKey = publicKey => {
    const script = slib.ScriptPubkey.new(publicKey.to_raw_key().hash())
    const nativeScript = slib.NativeScript.new_script_pubkey(script)

    return Buffer.from(
        slib.ScriptHash.from_bytes(
            nativeScript.hash().to_bytes()
        ).to_bytes(),
        "hex"
    )
}

const getSimpleNativeScriptForPublicKey = publicKey => {
    const script = slib.ScriptPubkey.new(publicKey.to_raw_key().hash())
    return slib.NativeScript.new_script_pubkey(script)
}

const getSimpleScriptHash = publicKey => {
    const script = slib.ScriptPubkey.new(publicKey.to_raw_key().hash())
    const nativeScript = slib.NativeScript.new_script_pubkey(script)

    return slib.ScriptHash.from_bytes(
        nativeScript.hash().to_bytes()
    )
}

module.exports = {
    generateKeySet,
    createRootKeyFromEntropy,
    createAccountKeyFromRootKey,
    createPrivateKeyFromAccountKey,
    getPublicKeyForPrivateKey,
    getSimpleBaseAddressForAccountKey,

    getSimpleScriptPolicyForPublicKey,
    getSimpleNativeScriptForPublicKey,
    getSimpleScriptHash,

    getHashForPubKey,

    mkTxBuilderConfig,
    mkTxBuilder,
    mkTxInput,
}