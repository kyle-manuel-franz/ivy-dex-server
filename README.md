# Ivy Dex Sever
Server side application to support ivy dex.

## Running Locally

Install Docker and Docker Compose

### Start Environment
Our environment runs on docker using containers.
In order for our server to run, we start our dependent services using:

`npm run start:docker`

This will start required databases and other monitoring services.


## Running Tests

`npm run test`

# Scripts

## Create Mint Policy Id

This script will create a simple policy Id that only requires the verification key from this recovery phrase wallet to mint.

`node scripts/mint/create-policy-script -r <recovery file>`

The recovery file should be a space separated list of words. (use `cardano-wallet recovery-phrase generate`)
