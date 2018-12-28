# Howdoo-Blockchain-Service

## Introduction

This is a monolithic Blockchain Service that exposes APIs for communicating with three blockchain networks namely Bitshares, Ethereum and Bitcoin. For Dev environment, Testnets of the aforementioned blockchians are utilized, details are below. The primary purpose of this API includes functionalities for: 
1. Transferring BTS (bitshares' token) on Howdoo's internal blockchain and Fetching the balance for accounts/address for the three blockchain network.
2. Getting the Price for the uDoo tokens.
3. Getting the transaction history for the accounts on the 3 blockchain networks.

This readme guides you through two processes:-

1. How to set up the project
2. Has a Postman collection specified to get you toying around with the project. 

# Postman Collection
- https://www.getpostman.com/collections/d3d63941d061f93c12c9

# Setup step
- npm install
- npm start


# testnet
- Bitshares => ws://192.168.10.81:11011 (testnet hosted locally)
- Ethereum => https://ropsten.etherscan.io (connected to infura)
- Bitcoin => https://testnet.blockexplorer.com

