const { mnemonicToEntropy } = require('bip39')
const slib = require('@emurgo/cardano-serialization-lib-nodejs')
const { Buffer } = require('buffer')

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

const utxoPubKey = accountKey
    .derive(0) // external
    .derive(0)
    .to_public();

const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0)
    .to_public();

const baseAddress = slib.BaseAddress.new(
    slib.NetworkInfo.testnet().network_id(),
    slib.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    slib.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
)

console.log(baseAddress.to_address().to_bech32())