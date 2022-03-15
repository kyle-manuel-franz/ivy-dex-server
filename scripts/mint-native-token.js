const { mnemonicToEntropy } = require('bip39')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const _ = require('lodash')
const blockfrost = require('../src/lib/blockfrost')
const {
    generateKeySet,
    mkTxBuilder,
    mkTxInput
} = require('../src/lib/slib');

(async () => {
    try {
        // const entropy = mnemonicToEntropy(
        //     "captain answer wife trial sell render energy describe cart design valid amateur layer clown eight"
        // );

        const entropy = mnemonicToEntropy(
            "unusual title win decrease baby sketch will horn belt cause runway sugar fault decade heavy drip chair borrow ancient bag zoo high hard bean"
        );

        const {
            baseAddress,
        } = generateKeySet(entropy);

        // const bech32_address = baseAddress.to_address().to_bech32()
        //
        // const pp = await blockfrost.fetchProtocolParameters()
        // const txBuilder = mkTxBuilder(pp)
        //
        // const utxosAtAddress = await blockfrost.getUtxosForAddress(bech32_address)
        // const txInputs = _.map(utxosAtAddress, utxo => mkTxInput(bech32_address, utxo))
        // txBuilder.add_input(txInputs[0][0], txInputs[0][1], txInputs[0][2])
    } catch (e) {
        console.error(e)
    }
})()