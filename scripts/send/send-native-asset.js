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
    getPublicKeyForPrivateKey,
    getSimpleBaseAddressForAccountKey,
    mkTxBuilder,
    mkTxInput,
    printTransactionOutputs
} = require('../../src/lib/slib');

const options = yargs
    .option("r", {
        alias: "recovery-file",
        describe: "the file with the recovery string",
        required: true
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
    .argv;

(async () => {
    try{
        const data = fs.readFileSync(options['recovery-file'])
        const entropyString = data.toString().trim()
        const entropy = mnemonicToEntropy(entropyString)
        const rootKey = createRootKeyFromEntropy(entropy)
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
        const txHash = slib.hash_transaction(txBody)
        const witness = slib.TransactionWitnessSet.new()

        const vkeywitnesses = slib.Vkeywitnesses.new()
        const vKeyWitness = slib.make_vkey_witness(txHash, privateKey.to_raw_key())
        vkeywitnesses.add(vKeyWitness)
        witness.set_vkeys(vkeywitnesses)

        printTransactionOutputs(txBody.outputs())

        const transaction = slib.Transaction.new(
            txBody,
            witness,
            undefined
        )

        const r = await blockfrost.submitTx(
            Buffer.from(
                transaction.to_bytes(),
                'hex'
            ).toString('hex')
        )

    } catch (e){
        console.error(e)
    }
})();