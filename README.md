# MePay - Blockchain Freelance Platform on NEAR
MePay is a prototype of a freelancing platform which stores it's data on the NEAR blockchain.

Application deployed at [https://medo-5jefp3.spheron.app/](https://medo-5jefp3.spheron.app/), currently running on NEAR testnet.
Smart Contract deployed at address 0x3aD0caD9E7Fb1A7A46F6F0665bbC97BdfDdaD740.

## Introduction
The idea of MeDo is to ease the difficulties faced by freelancers nowadays such as unsurity about payments and high fees charged by middlemen. Blockchain can help by guaranteeing payments with help of smart contracts, providing security and an integrated payment system which can save time delays and fees in cases of international payments and its decentralized nature mean there is no middleman.

## Install
1. Run `yarn` at the client directory to install the client dependencies

## Test
Run `cargo test` at the contract directory to run smart contract tests

## Compile
Assuming that all the tests passed ok, you can go ahead and compile the smart contract:

    `cargo build --target wasm32-unknown-unknown --release`

## Deploy contract
For development purposes you can use `dev-deploy` command and your smart contract will be deployed to the live NEAR TestNet with a throwaway account:

    `near dev-deploy --wasmFile target/wasm32-unknown-unknown/release/YOUR_CONTRACT_NAME.wasm`

 When you're ready to make it permanent, here's how:

    `near deploy --wasmFile target/wasm32-unknown-unknown/release/YOUR_CONTRACT_NAME.wasm --accountId YOUR_ACCOUNT_HERE`

## Prepare the client
1. Replace the cotract address in the utils/config.js with the new deployed one

## Run client
Run `yarn dev` at the client directory to run the client locally


