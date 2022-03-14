const { mnemonicToEntropy } = require('bip39')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require('buffer')
const _ = require('lodash')

const blockfrost = require('../src/lib/blockfrost')

const harden = num => {
    return 0x80000000 + num;
}

const entropy = mnemonicToEntropy(
    "captain answer wife trial sell render energy describe cart design valid amateur layer clown eight"
)

const rootKey = slib.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from('')
)

const accountKey = rootKey.derive(harden(1852)).derive(harden(1815)).derive(harden(0))

const utxoPrvKey = accountKey
    .derive(0)
    .derive(0)

const utxoPubKey = utxoPrvKey.to_public();

const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0)
    .to_public();

const baseAddress = slib.BaseAddress.new(
    slib.NetworkInfo.testnet().network_id(),
    slib.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    slib.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
);

const mkTxBuilderConfig = pp => {
    return slib.TransactionBuilderConfigBuilder.new()
        .coins_per_utxo_word(
            slib.BigNum.from_str(pp.coinsPerUtxoWord)
        )
        .fee_algo(
            slib.LinearFee.new(
                slib.BigNum.from_str(pp.linearFee.minFeeA),
                slib.BigNum.from_str(pp.linearFee.minFeeB)
            )
        )
        .key_deposit(slib.BigNum.from_str(pp.keyDeposit))
        .pool_deposit(
            slib.BigNum.from_str(pp.poolDeposit)
        )
        .max_tx_size(pp.maxTxSize)
        .max_value_size(pp.maxValSize)
        .prefer_pure_change(true)
        .build()
}

const mkTxBuilder = pp => {
    const txBuilderConfig = mkTxBuilderConfig(pp)
    return slib.TransactionBuilder.new(txBuilderConfig)
}

const mkTxInput = (address, utxo) => {
    return [
        slib.Address.from_bech32(address),
        slib.TransactionInput.new(
            slib.TransactionHash.from_bytes(
                Buffer.from(utxo.tx_hash, "hex")
            ),
            utxo.output_index
        ),
        slib.Value.new(slib.BigNum.from_str(utxo.amount[0].quantity))
    ]
}

(async () => {
    try {
        const bech32_address = baseAddress.to_address().to_bech32()
        // const info = await blockfrost.getSpecificAddress(bech32_address)
        const pp = await blockfrost.fetchProtocolParameters()
        const txBuilder = mkTxBuilder(pp)

        const utxosAtAddress = await blockfrost.getUtxosForAddress(bech32_address)
        const txInputs = _.map(utxosAtAddress, utxo => mkTxInput(bech32_address, utxo))

        console.log(utxosAtAddress, utxosAtAddress[0].amount)
        txBuilder.add_input(txInputs[0][0], txInputs[0][1], txInputs[0][2])

        const outputAddress = slib.Address.from_bech32("addr_test1qznfvl7nr5n26rxcrra029p6pqnyk02pde5cakv58ajm4qv06d8c09n4y2de0wrkh4xqpt55k32x2kyuxf365p5g3dhsf0xrhc")

        const adaToSend = 10
        const lovelaceToSend = adaToSend * 1000000

        txBuilder.add_output(
            slib.TransactionOutput.new(
                outputAddress,
                slib.Value.new(slib.BigNum.from_str(lovelaceToSend.toString()))
            )
        )

        txBuilder.add_change_if_needed(slib.Address.from_bech32(bech32_address))
        const txBody = txBuilder.build();
        const txHash = slib.hash_transaction(txBody)
        const witnesses = slib.TransactionWitnessSet.new()

        const vKeyWitnesses = slib.Vkeywitnesses.new()
        const vKeyWitness = slib.make_vkey_witness(txHash, utxoPrvKey.to_raw_key())
        vKeyWitnesses.add(vKeyWitness)
        witnesses.set_vkeys(vKeyWitnesses)

        const transaction = slib.Transaction.new(
            txBody,
            witnesses,
            undefined
        )

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
