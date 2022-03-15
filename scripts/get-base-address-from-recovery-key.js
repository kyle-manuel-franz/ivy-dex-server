#!/usr/bin/env node
/*
    This creates and outputs the base bech32 address from a mnemonic phrase
*/
const yargs = require('yargs')
const fs = require('fs')
const { mnemonicToEntropy } = require('bip39')

const {
    createRootKeyFromEntropy,
    createAccountKeyFromRootKey,
    getSimpleBaseAddressForAccountKey,
} = require('../src/lib/slib');

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
        const baseAddress = getSimpleBaseAddressForAccountKey(accountKey)
        console.log(baseAddress.to_address().to_bech32())
    } catch (e){
        console.error(e)
    }
})();