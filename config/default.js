module.exports = {
    blockfrost: {
        mainnet: {
            apiKey: process.env.BLOCKFROST_API_KEY_MAINNET || 'mainnet3Wt3PmvbaUaakS7oAF9H27x1pNmZmq3T',
            baseUrl: process.env.BLOCKFROST_URL_MAINNET || 'https://cardano-mainnet.blockfrost.io/api/v0'
        },
        testnet: {
            apiKey: process.env.BLOCKFROST_API_KEY_TESTNET || 'testnetZvl8BodJ5o4EbKgIfp2D4WQB8YE0ZCCW',
            baseUrl: process.env.BLOCKFROST_URL_TESTNET || 'https://cardano-testnet.blockfrost.io/api/v0'
        },
    },
    cardanoSyncDb: {
        location: process.env.CARDANO_SYNC_DB_LOCATION || 'localhost',
        port: process.env.CARDANO_SYNC_DB_PORT || 5432,
        user: process.env.CARDANO_SYNC_DB_USER || 'postgres',
        password: process.env.CARDANO_SYNC_DB_PASSWORD
    },
    port : process.env.PORT || 3001,
    smartContractIndexMongoDb: {
        mainnet: {},
        testnet: {
            port: process.env.SMART_CONTRACT_INDEX_MONGO_DB_PORT_TESTNET || 27017,
            location: process.env.SMART_CONTRACT_INDEX_MONGO_DB_LOCATION_TESTNET || 'localhost',
            user: process.env.SMART_CONTRACT_INDEX_MONGO_DB_USER_TESTNET || 'kfranz',
            password: process.env.SMART_CONTRACT_INDEX_MONGO_DB_PASSWORD_TESTNET,
            database: process.env.SMART_CONTRACT_INDEX_MONGO_DB_TESTNET || 'order_book_index'
        }
    }
}