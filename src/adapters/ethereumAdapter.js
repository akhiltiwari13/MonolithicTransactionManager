import { postRequest, getRequest } from "../lib/request";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { User } from "../entity/user";
import { Transfer } from "../entity/transfer";



/* required constants for ethereum adapter */
// const ETHEREUM_NODE_URL = `${config.get('ethereum_node_url.protocol')}${config.get('ethereum_node_url.host')}` ==> can this be used
// this.web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_NODE_URL))

const vaultBaseUrl = envConfig.get("vaultBaseUrl");
const Web3 = require('web3') // to get web3 to work.
const priceBaseUrl = envConfig.get("priceBaseUrl");
const ethChainId = 3; // 1 for mainnet and 3 for testnet


/* ETH Transaction */
if (typeof web3 !== 'undefined') {
    console.log('Web3 found');
    var web3 = new Web3(web3.currentProvider);
} else {
    // provider needs to be set from a config file.
    var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/90bfb15e855e41a8997b24d5f7a170e1"));
}

class EthereumAdapter {
    constructor(name) {
        this.name = name;
    }

    // account creation for ethereum only requires the account be created on the Vault
    createAccount = req =>
        new Promise((resolve, reject) => {
            let userUuidVault;
            return this._registerUserToVault(req)
                .then(result => {
                    userUuidVault = result.data.uuid;
                    return userUuidVault;
                })
                .then(res => {
                    const connection = getConnection();
                    const user = new User();
                    let accountName = req.body.name;
                    user.name = accountName;
                    user.vault_uuid = userUuidVault;
                    user.bts_publickey = "";
                    connection.manager
                        .save(user)
                        .then(() => resolve(res[0].id))
                        .catch(reject);
                    return resolve({ uuid: userUuidVault, name: user.name });
                })
                .catch(reject);
        });

    // developed and working; need to test.
    getBalance = (headers, accountName) =>
        new Promise(async (resolve, reject) => {
            const uuid = await this._getUuid(accountName);
            return this._getAddress(headers, uuid)
                .then(res => {
                    return res;
                })
                .then(res => {
                    return resolve(web3.eth.getBalance(res));
                })
                .catch(reject)
        })

    getPrice = (query) =>
        new Promise((resolve, reject) => {
            const url = `${priceBaseUrl}/data/price?fsym=ETH&tsyms=${query.currency}`;
            const headers = { Apikey: 'f212d4142590ea9d2850d73ab9bb78b6f414da4613786c6a83b7e764e7bf67f7' };
            return getRequest(url, {}, headers)
                .then(result => resolve({ coin: 'ETH', [query.currency]: result[query.currency] }))
                .catch(reject);
        });


    transfer = req =>
        new Promise(async (resolve, reject) => {
            const fromAccountUUID = await this._getUuid(req.body.fromAccount);
            const toAccountUUID = await this._getUuid(req.body.toAccount);
            const fromAccountAddress = await this._getAddress(req.headers, fromAccountUUID);
            const toAccountAddress = await this._getAddress(req.headers, toAccountUUID);
            const gasPrice = await this._getGasPrice();
            const gasLimit = await this._getGas("", fromAccountAddress, toAccountAddress);
            const amount = await this._getWeiFromEth(req.body.sendAmount);
            const nounce = await this._getNounce(fromAccountAddress);

            const payload = {
                nonce: nounce,
                value: Number(amount),
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                to: toAccountAddress,
                data: "", // what will this take?
                chainId: ethChainId
            }
            return this._signTransaction(payload, fromAccountUUID)
                .then(signedTransaction => {
                    console.log("signedTransaction: ", signedTransaction)
                    const transactionHash = web3.eth.sendRawTransaction(signedTransaction.signature);
                    return transactionHash;
                })
                .then(res => {
                    const connection = getConnection();
                    const transfer = new Transfer();
                    transfer.txn_id = res;
                    transfer.from = req.body.fromAccount;
                    transfer.to = req.body.toAccount;
                    transfer.amount = req.body.sendAmount;
                    transfer.coin_id = 'ETH';
                    transfer.txn_status = 'PENDING';
                    connection.manager
                        .save(transfer)
                        .then(() => resolve(res))
                        .catch(reject);
                })
                .catch(reject);
        });
    _registerUserToVault = req =>
        new Promise((resolve, reject) => {
            const url = `${vaultBaseUrl}/api/register`;
            const headers = { "x-vault-token": req.headers["x-vault-token"] };
            return postRequest(url, {}, headers)
                .then(resolve)
                .catch(reject);
        });

    // utility function to get the address for the account. 
    _getAddress = (headers, uuid) =>
        new Promise((resolve, reject) => {
            const body = {
                coinType: 60,
                path: "m/44'/60'/0'/0/0",
                uuid: uuid
            };
            const url = `${vaultBaseUrl}/api/address`;
            const vaultHeaders = { "x-vault-token": headers["x-vault-token"] };
            return postRequest(url, body, vaultHeaders)
                .then(res => {
                    return resolve(res.data.address);
                })
                .catch(reject);
        });

    _getUuid = async (account) => {
        const connection = getConnection();
        const UserRepository = connection.getRepository(User);
        const registrar = await UserRepository.findOne({ name: account });
        return registrar.vault_uuid;
    }

    _getGas = async (data, from, to) => {
        const gas = await web3.eth.estimateGas({ data, from, to });
        return gas;
    }

    _getGasPrice = async () => {
        const gasPrice = await (web3.eth.gasPrice * 1.5);
        return gasPrice;
    }

    _getNounce = async (fromAccount) => {
        const nounce = await web3.eth.getTransactionCount(fromAccount);
        return nounce;
    }

    _getWeiFromEth = async (amount) => {
        return web3.toWei(amount, 'ether');
    }

    _signTransaction = (payload, fromAccountUUID) => //LOG HERE....
        new Promise(async (resolve, reject) => {
            const url = `${vaultBaseUrl}/api/signature`;
            const body = {
                "coinType": 60,
                "path": "m/44'/60'/0'/0/0",
                "payload": JSON.stringify(payload),
                "uuid": fromAccountUUID
            }
            console.log("body: ", body);
            // needs to be passed as parameters instead...
            const headers = {
                "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s",
                "Content-Type": "application/json"
            };
            return postRequest(url, body, headers)
                .then(res => {
                    console.log("res:", res);
                    return resolve(res.data);
                })
                .catch(reject);
        });




    // TO BE WORKED ON.....
    getTransactionHistory = accountName =>
        new Promise(async (resolve, reject) => {
            const uuid = await this._getUuid(accountName);
            return this._getAddress(headers, uuid)
                .then(res => {
                    console.log("address,", res) // returns address; needs business logic to actually fetch the balance.
                    return res;
                })
                .then(res => {
                    return resolve(web3.eth.getBalance(res)); // business logic for transaction history
                })
                .catch(reject)
        })

}

export default EthereumAdapter;
