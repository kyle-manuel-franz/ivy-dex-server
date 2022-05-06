# Ivy Dex Sever
Server side application to support ivy dex!
## Running Locally!

Install Docker and Docker Compose

### Start Environment
Our environment runs on docker using containers.
In order for our server to run, we start our dependent services using:

`npm run start:docker`

This will start required databases and other monitoring services.


## Running Tests

`npm run test`

# Scripts

### Create Mint Policy Id

This script will create a simple policy Id that only requires the verification key from this recovery phrase wallet to mint.

`node scripts/mint/create-policy-script -r <recovery file>`

The recovery file should be a space separated list of words. (use `cardano-wallet recovery-phrase generate`)

### Create Mint Transaction

`node scripts/mint/create-mint-transaction -r <recovery file>`

This will create and submit a transaction to blockfrost to mint a coin.

### Convert Mnemonic to Root Key

`node scripts/keys/convert-mnemonic-to-root-key.js -r <recovery file>`

Will return a bech_32 version of a root key for the specified file. 


## Grafana

We use Grafana for monitoring an Loki for log management

`npm run start:monitoring`

Will start the docker configuration to run the grafana dashboard. If you don't have a local config, you may need to add permissions for the docker container to modify files and folders in the directory.
The default username and password is "admin" and "admin". Once you login for the first time, you will be prompted to enter a new password.
