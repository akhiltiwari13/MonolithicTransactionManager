import { postRequest } from "../lib/request";
import prepareBody from "../utils/requestBody";
import envConfig from "../../config/envConfig";
import { Apis } from "bitsharesjs-ws"; // remove this eventually
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs"; // remove this eventually
import { getConnection } from "typeorm";
import { User } from "../entity/user";

// import { Tx } from "ethereumjs-tx"
import { Transfer } from "../entity/transfer";

const BTSBaseUrl = envConfig.get("btsBaseUrl");  //what should be ETHBase URL?
const vaultBaseUrl = envConfig.get("vaultBaseUrl");
const Web3 = require('web3') // to get web3 to work.

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


    // TO BE WORKED ON.....

    transfer = req =>
        new Promise((resolve, reject) => {
            let chainId;
            const fromAccount = req.body.fromAccount;
            const toAccount = req.body.toAccount;
            // const amount = req.body.sendAmount * 100000;
            const amount = req.body.sendAmount
            const sendAmount = {
                amount,
                asset: "BTS"
            };
            let tr = new TransactionBuilder();

            // what will be the value for nounce, value, gasLimit, gasPrice and chain id? is it hardcoded?
            const payload = {
                nonce: 0,
                value: amount,
                gasLimit: 21000,
                gasPrice: 5,
                to: toAccount,
                data: "",
                chainId: 1
            }

            // to be sent to 
            const data = {
                "uuid": uuid,
                "path": "m/44'/60'/0'/0/0",
                "coinType": 60,
                "payload": JSON.stringify(payload)
            }
            Apis.instance("ws://192.168.10.81:11011", true)
                .init_promise.then(res => {
                    chainId = res[0].network.chain_id;
                    return ChainStore.init();
                })
                .then(() =>
                    Promise.all([
                        FetchChain("getAccount", `hwd${fromAccount}`),
                        FetchChain("getAccount", `hwd${toAccount}`),
                        FetchChain("getAsset", sendAmount.asset),
                        FetchChain("getAsset", sendAmount.asset)
                    ])
                )
                .then(res => {
                    let [fromAccount, toAccount, sendAsset, feeAsset] = res;

                    tr.add_type_operation("transfer", {
                        fee: {
                            amount: 0,
                            asset_id: feeAsset.get("id")
                        },
                        from: fromAccount.get("id"),
                        to: toAccount.get("id"),
                        amount: {
                            amount: sendAmount.amount,
                            asset_id: sendAsset.get("id")
                        }
                    });

                    return tr.set_required_fees();
                })
                .then(() => tr.finalize())
                .then(() => {
                    const tr_buff = Buffer.concat([
                        new Buffer(chainId, "hex"),
                        tr.tr_buffer
                    ]);
                    const trBuff = tr_buff.toString("hex");
                    return this._getSignature(trBuff, req.body.fromAccount, false);
                })
                .then(sign => {
                    tr.signatures.push(sign);
                    return tr.broadcast();
                })
                .then(res => {
                    const connection = getConnection();
                    const transfer = new Transfer();
                    transfer.tx_id = res[0].id;
                    transfer.from = fromAccount;
                    transfer.to = toAccount;
                    transfer.amount = amount;
                    connection.manager
                        .save(transfer)
                        .then(() => resolve(res[0].id))
                        .catch(reject);
                })
                .catch(reject);
        });


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


    _getPublicKey = (req, uuid) =>
        new Promise((resolve, reject) => {
            const body = {
                coinType: 240,
                path: "",
                uuid
            };
            const url = `${vaultBaseUrl}/api/address`;
            const headers = { "x-vault-token": req.headers["x-vault-token"] };
            return postRequest(url, body, headers)
                .then(res => resolve(res.data.publicKey))
                .catch(reject);
        });



    _getSignature = (trHex, registrarAccount, isRegister) => { }
    // new Promise(async (resolve, reject) => {
    //     const url = `${vaultBaseUrl}/api/signature`;
    //     const txDigest = {
    //         transactionDigest: trHex
    //     };
    //     const registrarUuid = isRegister ? 'bgd3f7lgouhs7rjiapd0' : await this._getUuid(registrarAccount);
    //     const body = {
    //         coinType: 240,
    //         path: "",
    //         payload: JSON.stringify(txDigest),
    //         uuid: registrarUuid
    //     };
    //     const headers = {
    //         "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s",
    //         "Content-Type": "application/json"
    //     };
    //     return postRequest(url, body, headers)
    //         .then(res => {
    //             return resolve(res.data.signature);
    //         })
    //         .catch(reject);
    // });

}

export default EthereumAdapter;
