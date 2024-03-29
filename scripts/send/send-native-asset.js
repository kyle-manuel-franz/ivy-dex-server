#!/usr/bin/env node
/*
    This should send a native from from a wallet to a new address (bech_32)
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
    getSimpleBaseAddressForAccountKey,
    mkTxBuilder,
    mkTxInput,
    printTransactionOutputs,
    hashAndSignTx
} = require('../../src/lib/slib');

const options = yargs
    .option("r", {
        alias: "recovery-file",
        describe: "the file with the recovery string",
        required: true
    })
    .options("k", {
        alias: "root-key",
        describe: "Root key (bech_32). Use this instead of the recovery file",
        required: false,
    })
    .option('p', {
        alias: 'policyid',
        describe: 'the policy id of the native token',
        required: true,
    })
    .option('t', {
        alias: 'tokenname',
        describe: 'the token name of the asset you want to send (utf8)',
        required: true
    })
    .option('n', {
        alias: 'tokenamount',
        describe: 'the amount of the native token to send',
        required: true
    })
    .option('a', {
        alias: 'output-address',
        describe: 'the output address to receive the native tokens',
        required: true
    })
    .option('d', {
        alias: 'dry-run',
        describe: "if true, it will not submit the transaction to blockfrost",
        default: false
    })
    .argv;

(async () => {
    try{
        let rootKey
        if(options['recovery-file']){
            const data = fs.readFileSync(options['recovery-file'])
            const entropyString = data.toString().trim()
            const entropy = mnemonicToEntropy(entropyString)
            rootKey = createRootKeyFromEntropy(entropy)
        } else {
            rootKey = slib.Bip32PrivateKey.from_bech32(options['root-key'])
        }

        const accountKey = createAccountKeyFromRootKey(rootKey)
        const privateKey = createPrivateKeyFromAccountKey(accountKey)
        const baseAddress = getSimpleBaseAddressForAccountKey(accountKey)

        const pp = await blockfrost.fetchProtocolParameters()
        const txBuilder = mkTxBuilder(pp)

        const utxosAtAddress = await blockfrost.getUtxosForAddress(baseAddress.to_address().to_bech32())
        const txInputs = _.map(utxosAtAddress, u => mkTxInput(baseAddress.to_address().to_bech32(), u))

        for(let i = 0; i < txInputs.length; i++){
            txBuilder.add_input(txInputs[i][0], txInputs[i][1], txInputs[i][2])
        }

        const output_address = slib.Address.from_bech32(options['output-address'])

        const nativeAssetName = slib.AssetName.new(Buffer.from(options.tokenname))

        const multiAsset = slib.MultiAsset.new()
        const assets = slib.Assets.new()
        assets.insert(nativeAssetName, slib.BigNum.from_str(options.tokenamount.toString()))

        const policyScriptHash = slib.ScriptHash.from_bytes(Buffer.from(options.policyid, "hex"))
        multiAsset.insert(policyScriptHash, assets)

        const value = slib.Value.new_from_assets(multiAsset)

        const lovelaceValue = slib.Value.new(slib.BigNum.from_str('1379280'))
        const finValue = value.checked_add(lovelaceValue)

        const txOutput = slib.TransactionOutput.new(output_address, finValue)
        txBuilder.add_output(txOutput)

        txBuilder.add_change_if_needed(baseAddress.to_address())

        const txBody = txBuilder.build()

        printTransactionOutputs(txBody.outputs())

        const transaction = hashAndSignTx(txBody, privateKey)

        if(options['dry-run']){
            console.log('dry run')
        } {
            const r = await blockfrost.submitSlibTx(transaction)
        }

    } catch (e){
        console.error(e)
    }
})();