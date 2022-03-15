#!/usr/bin/env node
/*
    This should create a file for a script policy
*/
const yargs = require('yargs')
const fs = require('fs')
const { mnemonicToEntropy } = require('bip39')
const blockfrost = require('../../src/lib/blockfrost')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')

const {
    createRootKeyFromEntropy,
    createAccountKeyFromRootKey,
    createPrivateKeyFromAccountKey,
    getPublicKeyForPrivateKey,
    getHashForPubKey,
    getSimpleScriptHash,
    getSimpleBaseAddressForAccountKey
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
        // const utxosAtAddress = await blockfrost.getUtxosForAddress(baseAddress.to_address().to_bech32())

        const tokenNameUtf = 'juliet_coin'
        const assetName = slib.AssetName.new(Buffer.from(tokenNameUtf))
        const mintAssets = slib.MintAssets.new_from_entry(
            assetName,
            slib.Int.new_i32(1000000000)
        )
        const policyScriptHash = getSimpleScriptHash(publicKey)
        const mint = slib.Mint.new_from_entry(policyScriptHash, mintAssets)

        console.log(mint)
    } catch (e){
        console.error(e)
    }
})();