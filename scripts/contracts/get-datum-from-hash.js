#!/usr/bin/env node
/*
    This should output specific info about an address
*/
const yargs = require('yargs')
const blockfrost = require('../../src/lib/blockfrost')

const options = yargs
    .option("d", {
        alias: "datum_hash",
        describe: "hash of datum",
        required: true
    })
    .argv;

(async () => {
    try{
        const datum = await blockfrost.getDatumFromDatumHash(options['datum_hash'])
        console.log(datum)
    } catch (e){
        console.error(e)
    }
})();