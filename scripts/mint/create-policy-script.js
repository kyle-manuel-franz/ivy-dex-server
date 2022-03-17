#!/usr/bin/env node
/*
    This should print out a policy id given a recovery phrase. It can optionally create a script json file
*/
const yargs = require('yargs')
const fs = require('fs')
const { mnemonicToEntropy } = require('bip39')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')

const {
    createRootKeyFromEntropy,
    createAccountKeyFromRootKey,
    createPrivateKeyFromAccountKey,
    getPublicKeyForPrivateKey,
    getHashForPubKey,
    getSimpleScriptPolicyForPublicKey
} = require('../../src/lib/slib')

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
    .option("o", {
        alias: "output-script-file",
        describe: "the file output location for the policy script",
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
        const publicKey = getPublicKeyForPrivateKey(privateKey)

        const policyId = getSimpleScriptPolicyForPublicKey(publicKey)
        console.log(policyId.toString('hex'))

        if(options['output-file']){
            const scriptJson = {
                "keyHash": getHashForPubKey(publicKey),
                "type": "sig"
            }

            const outData = JSON.stringify(scriptJson)
            fs.writeFileSync(options['output-file'], outData)
        }
    } catch (e){
        console.error(e)
    }
})()