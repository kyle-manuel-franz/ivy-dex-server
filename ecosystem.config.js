module.exports = {
  apps : [{
    name: 'web',
    script: './src/index.js',
    watch: './src',
    color: 'green'
  }, {
    name: 'utxo_sync_worker',
    script: './src/workers/utxo_sync/index.js',
    watch: ['./src/workers/utxo_sync']
  }],
};
