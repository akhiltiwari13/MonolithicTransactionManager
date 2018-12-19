import { postRequest } from "../lib/request";
import prepareBody from "../utils/requestBody";
import envConfig from "../../config/envConfig";
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import { getConnection } from "typeorm";
import { User } from "../entity/user";
import { Transfer } from "../entity/transfer";

const baseUrl = envConfig.get("baseUrl");
const vaultBaseUrl = envConfig.get("vaultBaseUrl");

class BitsharesAdapter {
  constructor(name) {
    this.name = name;
  }

  getBalance = accountName =>
    new Promise((resolve, reject) =>
      this._getAccountId(`hwd${accountName}`)
        .then(accountId => this._getAccountBalance(accountId))
        .then(balance => resolve({ accountName, balance: balance / 100000, unit: "BTS" }))
        .catch(reject));

  getTransactionHistory = accountName =>
    new Promise((resolve, reject) => {
      return Apis.instance("ws://192.168.10.81:11011", true) // TODO: Replace URL from a value from config file
        .init_promise.then(() => ChainStore.init())
        .then(() => this._getAccountId(`hwd${accountName}`))
        .then(accountId => Promise.all([FetchChain("fetchFullAccount", accountId)]))
        .then(res => {
          let [fullAccountHistory] = res;
          resolve(fullAccountHistory.get("history"));
        })
        .catch(reject);
    });

  createAccount = req =>
    new Promise((resolve, reject) => {
      let userUuidVault, publicKey, chainId;
      return this._registerUserToVault(req)
        .then(result => {
          userUuidVault = result.data.uuid;
          return this._getPublicKey(req, userUuidVault);
        })
        .then(pubKey => {
          let tr = new TransactionBuilder();
          let registrarAccount = "nathan";
          let accountName = req.body.name;
          publicKey = pubKey;
          Apis.instance("ws://192.168.10.81:11011", true) // TODO: Replace URL
            .init_promise.then(res => {
              chainId = res[0].network.chain_id;
              return ChainStore.init();
            })
            .then(() => Promise.all([FetchChain("getAccount", registrarAccount)]))
            .then(res => {
              let [registrarAccount] = res;

              /* Account Create */
              tr.add_type_operation("account_create", {
                referrer_percent: 0,
                registrar: registrarAccount.get("id"),
                referrer: registrarAccount.get("id"),
                name: `hwd${accountName}`,
                owner: {
                  weight_threshold: 1,
                  account_auths: [],
                  key_auths: [[publicKey, 1]],
                  address_auths: []
                },
                active: {
                  weight_threshold: 1,
                  account_auths: [],
                  key_auths: [[publicKey, 1]],
                  address_auths: []
                },
                options: {
                  memo_key: publicKey,
                  voting_account: "1.2.5",
                  num_witness: 0,
                  num_committee: 0,
                  votes: [],
                  extensions: []
                }
              });
              /* Account Create */

              tr.set_required_fees();
            })
            .then(() => tr.finalize())
            .then(() => {
              const tr_buff = Buffer.concat([
                new Buffer(chainId, "hex"),
                tr.tr_buffer
              ]);
              const trBuff = tr_buff.toString("hex");
              return this._getSignature(trBuff, registrarAccount);
            })
            .then(sign => {
              tr.signatures.push(sign);
              return tr.broadcast();
            })
            .then(res => {
              const connection = getConnection();
              const user = new User();
              user.name = accountName;
              user.vault_uuid = userUuidVault;
              user.bts_publickey = publicKey;
              connection.manager
                .save(user)
                .then(() => resolve(res[0].id))
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });

  transfer = req =>
    new Promise((resolve, reject) => {
      let chainId;
      const fromAccount = req.body.fromAccount;
      const toAccount = req.body.toAccount;
      const amount = req.body.sendAmount * 100000;
      const sendAmount = {
        amount,
        asset: "BTS"
      };
      let tr = new TransactionBuilder();
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
          return this._getSignature(trBuff, req.body.fromAccount);
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

  _registerUserToVault = req =>
    new Promise((resolve, reject) => {
      const url = `${vaultBaseUrl}/api/register`;
      const headers = { "x-vault-token": req.headers["x-vault-token"] };
      return postRequest(url, {}, headers)
        .then(resolve)
        .catch(reject);
    });

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

  _getUuid = async (registrarAccount) => {
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: registrarAccount });
    return registrar.vault_uuid;
  }

  _getSignature = (trHex, registrarAccount) =>
    new Promise(async (resolve, reject) => {
      const url = `${vaultBaseUrl}/api/signature`;
      const txDigest = {
        transactionDigest: trHex
      };
      const registrarUuid = await this._getUuid(registrarAccount);
      const body = {
        coinType: 240,
        path: "",
        payload: JSON.stringify(txDigest),
        uuid: registrarUuid
      };
      const headers = {
        "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s",
        "Content-Type": "application/json"
      };
      return postRequest(url, body, headers)
        .then(res => {
          return resolve(res.data.signature);
        })
        .catch(reject);
    });

  _getAccountId = accountName =>
    new Promise((resolve, reject) => {
      const body = prepareBody([0, "lookup_account_names", [[accountName]]]);
      const url = `${baseUrl}/account_id?account_name=${accountName}`;
      return postRequest(url, body)
        .then(response => {
          const accountId = response.result[0].id;
          resolve(accountId);
        })
        .catch(reject)
    });

  _getAccountBalance = accountId =>
    new Promise((resolve, reject) => {
      const body = prepareBody([
        0,
        "get_account_balances",
        [accountId, ["1.3.0"]]
      ]); //hardcoded to get the BTS balance
      const url = `${baseUrl}/rpc`;
      return postRequest(url, body)
        .then(response => {
          const balance = response.result[0].amount;
          resolve(balance);
        })
        .catch(reject);
    });

}

export default BitsharesAdapter;
