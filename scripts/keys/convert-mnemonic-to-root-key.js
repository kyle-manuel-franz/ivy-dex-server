#!/usr/bin/env node
/*
    This should convert a mnemonic phrase to a bech32 bip32 private key
*/
const yargs = require('yargs')
const fs = require('fs')
const { mnemonicToEntropy } = require('bip39')

const {
    createRootKeyFromEntropy,
} = require('../../src/lib/slib');

const options = yargs
    .option("r", {
        alias: "recovery-file",
        describe: "the file with the recovery string",
        required: true
    })
    .argv;

(async () => {
    try {
        const data = fs.readFileSync(options['recovery-file'])
        const entropyString = data.toString().trim()
        const entropy = mnemonicToEntropy(entropyString)
        const rootKey = createRootKeyFromEntropy(entropy)
        const rootKeyBech32 = rootKey.to_bech32()

        console.log(rootKeyBech32)
    } catch (e){
        console.error(e)
    }
})()