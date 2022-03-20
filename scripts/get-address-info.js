#!/usr/bin/env node
/*
    This should output specific info about an address
*/
const yargs = require('yargs')
const blockfrost = require('../src/lib/blockfrost')

const options = yargs
    .option("a", {
        alias: "address",
        describe: "bech_32 address to query",
        required: true
    })
    .argv;

(async () => {
    try{
        const info = await blockfrost.getSpecificAddress(options.address)
        console.log(info)
        const utxos = await blockfrost.getUtxosForAddress(options.address)
        console.log(utxos)
    } catch (e){
        console.error(e)
    }
})();