#!/usr/bin/env node
/*
    This should create a file for a script policy
*/
const yargs = require('yargs')
const fs = require('fs')
const { mnemonicToEntropy } = require('bip39')
const blockfrost = require('../../src/lib/blockfrost')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const _ = require('lodash')

const {
    createRootKeyFromEntropy,
    createAccountKeyFromRootKey,
    createPrivateKeyFromAccountKey,
    getPublicKeyForPrivateKey,
    getHashForPubKey,
    getSimpleNativeScriptForPublicKey,
    getSimpleScriptHash,
    getSimpleBaseAddressForAccountKey,
    mkTxBuilder,
    mkTxInput
} = require('../../src/lib/slib');

const options = yargs
    .option("r", {
        alias: "recovery-file",
        describe: "the file with the recovery string",
        required: true
    })
    .argv;

(async () => {
    try{
        const data = fs.readFileSync(options['recovery-file'])
        const entropyString = data.toString().trim()
        const entropy = mnemonicToEntropy(entropyString)
        const rootKey = createRootKeyFromEntropy(entropy)
        const accountKey = createAccountKeyFromRootKey(rootKey)
        const privateKey = createPrivateKeyFromAccountKey(accountKey)
        const publicKey = getPublicKeyForPrivateKey(privateKey)
        const baseAddress = getSimpleBaseAddressForAccountKey(accountKey)

        // const info = await blockfrost.getSpecificAddress(baseAddress.to_address().to_bech32())

        const tokenNameUtf = 'juliet_coin'
        const assetName = slib.AssetName.new(Buffer.from(tokenNameUtf))
        const mintAssets = slib.MintAssets.new_from_entry(
            assetName,
            slib.Int.new_i32(1000000000)
        )
        const policyScriptHash = getSimpleScriptHash(publicKey)
        console.log(Buffer.from(policyScriptHash.to_bytes(), 'hex').toString('hex'))
        const simpleNativeScript = getSimpleNativeScriptForPublicKey(publicKey)
        const mint = slib.Mint.new_from_entry(policyScriptHash, mintAssets)

        const pp = await blockfrost.fetchProtocolParameters()
        const txBuilder = mkTxBuilder(pp)
        const ns = slib.NativeScripts.new()
        ns.add(simpleNativeScript)
        txBuilder.set_mint(mint, ns)

        const utxosAtAddress = await blockfrost.getUtxosForAddress(baseAddress.to_address().to_bech32())
        const txInputs = _.map(utxosAtAddress, utxo => mkTxInput(baseAddress.to_address().to_bech32(), utxo))

        txBuilder.add_input(txInputs[0][0], txInputs[0][1], txInputs[0][2])

        const multiAsset = slib.MultiAsset.new()
        const assets = slib.Assets.new()
        assets.insert(assetName, slib.BigNum.from_str('1000000000'))
        multiAsset.insert(policyScriptHash, assets)

        const value = slib.Value.new_from_assets(multiAsset)

        const lovelaceValue = slib.Value.new(slib.BigNum.from_str('1379280'))
        const finValue = value.checked_add(lovelaceValue)

        const txOutput = slib.TransactionOutput.new(baseAddress.to_address(), finValue)
        txBuilder.add_output(txOutput)

        txBuilder.add_change_if_needed(baseAddress.to_address())

        const txBody = txBuilder.build()
        const txHash = slib.hash_transaction(txBody)
        const witnesses = slib.TransactionWitnessSet.new()

        const vkeywitnesses = slib.Vkeywitnesses.new()
        const vKeyWitness = slib.make_vkey_witness(txHash, privateKey.to_raw_key())
        vkeywitnesses.add(vKeyWitness)
        witnesses.set_vkeys(vkeywitnesses)
        witnesses.set_native_scripts(ns)

        const transaction = slib.Transaction.new(
            txBody,
            witnesses,
            undefined
        )

        const r = await blockfrost.submitTx(
            Buffer.from(
                transaction.to_bytes(),
                'hex'
            ).toString('hex')
        )

        console.log(r)
    } catch (e){
        console.error(e)
    }
})();