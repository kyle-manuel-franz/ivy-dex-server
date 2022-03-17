#!/usr/bin/env node
/*
    This should send a lovelace from the owner of the specified recovery phrase, to the address (bech_32)
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
    .option('n', {
        alias: 'lovelace',
        describe: 'the amount of lovelace to send 1 ada = 1000000 lovelace',
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
    try {
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

        const txOutput = slib.TransactionOutput.new(
            output_address,
            slib.Value.new(slib.BigNum.from_str(options['lovelace'].toString()))
        )

        txBuilder.add_output(txOutput)
        txBuilder.add_change_if_needed(baseAddress.to_address())

        const txBody = txBuilder.build()

        printTransactionOutputs(txBody.outputs())

        const transaction = hashAndSignTx(txBody, privateKey)

        if(options['dry-run']){
            console.log('dry run')
        } else {
            const r = await blockfrost.submitSlibTx(transaction)
        }

    } catch (e){
        console.error(e)
    }
})()