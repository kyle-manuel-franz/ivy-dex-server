const { mnemonicToEntropy } = require('bip39')
const _ = require('lodash')
const blockfrost = require('../src/lib/blockfrost')
const fs = require('fs')
const yargs = require('yargs')

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
} = require('../src/lib/slib');

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
        const accountKey = createAccountKeyFromRootKey(rootKey)
        const privateKey = createPrivateKeyFromAccountKey(accountKey)
        const publicKey = getPublicKeyForPrivateKey(privateKey)
        const baseAddress = getSimpleBaseAddressForAccountKey(accountKey)

        const bech32_address = baseAddress.to_address().to_bech32()
        const info = await blockfrost.getSpecificAddress(bech32_address)
        const pp = await blockfrost.fetchProtocolParameters()
        const txBuilder = mkTxBuilder(pp)

        const utxosAtAddress = await blockfrost.getUtxosForAddress(bech32_address)
        console.log({ info, utxosAtAddress })
        // const txInputs = _.map(utxosAtAddress, utxo => mkTxInput(bech32_address, utxo))
        //
        // console.log(utxosAtAddress, utxosAtAddress[0].amount)
        // txBuilder.add_input(txInputs[0][0], txInputs[0][1], txInputs[0][2])
        //
        // const outputAddress = slib.Address.from_bech32("addr_test1qznfvl7nr5n26rxcrra029p6pqnyk02pde5cakv58ajm4qv06d8c09n4y2de0wrkh4xqpt55k32x2kyuxf365p5g3dhsf0xrhc")
        //
        // const adaToSend = 10
        // const lovelaceToSend = adaToSend * 1000000
        //
        // txBuilder.add_output(
        //     slib.TransactionOutput.new(
        //         outputAddress,
        //         slib.Value.new(slib.BigNum.from_str(lovelaceToSend.toString()))
        //     )
        // )
        //
        // // TODO: we need to determine if this carries over native tokens
        // txBuilder.add_change_if_needed(slib.Address.from_bech32(bech32_address))
        // const txBody = txBuilder.build();
        // const txHash = slib.hash_transaction(txBody)
        // const witnesses = slib.TransactionWitnessSet.new()
        //
        // const vKeyWitnesses = slib.Vkeywitnesses.new()
        // const vKeyWitness = slib.make_vkey_witness(txHash, utxoPrvKey.to_raw_key())
        // vKeyWitnesses.add(vKeyWitness)
        // witnesses.set_vkeys(vKeyWitnesses)
        //
        // const transaction = slib.Transaction.new(
        //     txBody,
        //     witnesses,
        //     undefined
        // )

        // const r = await blockfrost.submitTx(
        //     Buffer.from(
        //         transaction.to_bytes(),
        //         'hex'
        //     ).toString('hex')
        // )
        // console.log(r)
    }
    catch (e) {
        console.error(e)
    }
})()
