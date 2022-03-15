/*
    This module should provider utils / wrappers around cardano's
    serialization lib
 */
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const _ = require('lodash')
const util = require('util')
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
    let lovelaceValue = null
    let otherValues = []
    for(let i = 0; i < utxo.amount.length; i++){
        const amount = utxo.amount[i]

        if(amount.unit === 'lovelace'){
            lovelaceValue = slib.Value.new(slib.BigNum.from_str(amount.quantity))
        } else {
            const multiAsset = slib.MultiAsset.new()
            const assets = slib.Assets.new()

            const policyId = amount.unit.substring(0, 56)
            const tokenName = Buffer.from(amount.unit.substring(56), 'hex').toString('utf8')

            const nativeAssetName = slib.AssetName.new(Buffer.from(tokenName))
            assets.insert(nativeAssetName, slib.BigNum.from_str(amount.quantity))

            const policyScriptHash = slib.ScriptHash.from_bytes(Buffer.from(policyId, "hex"))
            multiAsset.insert(policyScriptHash, assets)

            const value = slib.Value.new_from_assets(multiAsset)
            otherValues.push(value)
        }
    }

    let finValue = lovelaceValue
    for(let i = 0; i < otherValues.length; i++){
        finValue = finValue.checked_add(otherValues[i])
    }

    return [
        slib.Address.from_bech32(address),
        slib.TransactionInput.new(
            slib.TransactionHash.from_bytes(
                Buffer.from(utxo.tx_hash, "hex")
            ),
            utxo.output_index
        ),
        finValue
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

const printTransactionOutputs = txOutputs => {
    const printObject = []
    for(let o = 0; o < txOutputs.len(); o++){
        const outputObject = {}
        const output = txOutputs.get(o)
        outputObject['address'] = output.address().to_bech32()

        const amounts = []
        amounts.push({
            unit: 'lovelace',
            quantity: output.amount().coin().to_str()
        })

        const multiAssets = output.amount().multiasset()
        if(multiAssets){
            for(let i = 0; i < multiAssets.keys().len(); i++){
                const scriptHash = multiAssets.keys().get(i)
                const assets = multiAssets.get(scriptHash)
                for(let a = 0; a < assets.keys().len(); a++){
                    const assetName = assets.keys().get(a)
                    const assetNameUtf = Buffer.from(assetName.name()).toString()

                    const amount = assets.get(assetName)
                    amounts.push({
                        unit: assetNameUtf,
                        amount: amount.to_str()
                    })
                }
            }
        }

        outputObject['amounts'] = amounts
        printObject.push(outputObject)
    }
    console.log(util.inspect(printObject, { depth: null}))
}

const hashAndSignTx = (txBody, privateKey) => {
    const txHash = slib.hash_transaction(txBody)
    const witness = slib.TransactionWitnessSet.new()

    const vkeywitnesses = slib.Vkeywitnesses.new()
    const vKeyWitness = slib.make_vkey_witness(txHash, privateKey.to_raw_key())
    vkeywitnesses.add(vKeyWitness)
    witness.set_vkeys(vkeywitnesses)

    return slib.Transaction.new(
        txBody,
        witness,
        undefined
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

    printTransactionOutputs,

    hashAndSignTx,
}