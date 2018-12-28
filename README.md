# Howdoo-Blockchain-Service

## Introduction
This is a monolithic Blockchain Service that exposes APIs for communicating with three blockchain networks namely Bitshares, Ethereum and Bitcoin. For Dev environment, Testnets of the aforementioned blockchians are utilized, details are below. The primary purpose of this API includes functionalities for: 
1. Transferring BTS (bitshares' token) on Howdoo's internal blockchain and Fetching the balance for accounts/address for the three blockchain network.
2. Getting the Price for the uDoo tokens.
3. Getting the transaction history for the accounts on the 3 blockchain networks.
4. Creates account on the Vault and it's counterpart on the bitshares testnet.

This readme guides you through two processes:-

1. How to set up the project with all the dependent modules.
2. Has a Postman collection specified to get you toying around with the project. 

# Project Dependencies
- This service requires the following programs for it's functioning.
1. nodeJs
2. Postgresql (used as the service's database)
3. Hashicorp Vault (for secrets management, current instance is hosted at 192.168.10.81:8200) 

# Postman Collection
- https://www.getpostman.com/collections/289e13185b0dbf5120a3


# Setup step
- npm install
- npm start


# testnet
- Bitshares => ws://192.168.10.81:11011 (testnet hosted locally)
- Ethereum => https://ropsten.etherscan.io (connected to infura)
- Bitcoin => https://testnet.blockexplorer.com


# work in progress:
The Service is in active development, Here are a few noteworthy points.
1. master branch only has services pertaining to the Bitshares Adapter at the moment
2. Ethereum and Bitcoin functionalities are being developed on 2 feature branches, they will be merged into master by early first week of Jan 2019.
