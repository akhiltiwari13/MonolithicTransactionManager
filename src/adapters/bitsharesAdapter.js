import { postRequest, getRequest } from "../lib/request";
import prepareBody from "../utils/requestBody";
import envConfig from "../../config/envConfig";
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import { getConnection, Like } from "typeorm";
import { User } from "../entity/user";
import EthereumAdapter from "./ethereumAdapter";
import { Transfer } from "../entity/transfer";
import { BadRequestError } from '../errors'
import BigNumber from 'bignumber.js';
import moment from 'moment';
import _ from 'lodash';
import CommonAdapater from "./commonAdapter";

const BTSBaseUrl = envConfig.get("btsBaseUrl");
const priceBaseUrl = envConfig.get("priceBaseUrl");
const priceApiKey = envConfig.get("priceApiKey");
const vaultToken = envConfig.get("vaultToken");
const vaultBaseUrl = envConfig.get("vaultBaseUrl");
const btsWebSocketUrl = envConfig.get('btsWSUrl');
const nathanUuid = envConfig.get('nathanUuid');
const BtsServiceBaseUrl = envConfig.get('btsServiceBaseUrl');

class BitsharesAdapter {

  constructor(name) {
    this.name = name;
  }

  getAddress = (headers, accountName) =>
    new Promise((resolve, reject) =>
      resolve({ 'BTS': `hwd${accountName}` }));

  getBalance = (headers, accountName) => // headers required for other adapters.
    new Promise(async (resolve, reject) => {
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new BadRequestError('Account does not exists'));
      }
      return this._getAccountId(`hwd${accountName}`)
        .then(accountId => this._getAccountBalance(accountId))
        .then(balance => resolve({ accountName, balance: new BigNumber(balance).div(100000).toString(), unit: "UDOO" }))
        .catch(reject)
    });

  getTransactionHistory = (headers, accountName, query) =>
    new Promise(async (resolve, reject) => {
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const order = query.order || 'DESC';
      const days = query.days || 7;
      const txnType = query.txnType || 'all';
      let before = moment().format('YYYY-MM-DD');
      let whereCondition = [];

      if(!query.days && txnType === 'all') {
        whereCondition.push({ from: accountName, coin_id: 'BTS' });
        whereCondition.push({ to: accountName, coin_id: 'BTS' });
      }
      if(query.days && txnType === 'all'){
        for(let day = 1; day <= days; day++) {
          whereCondition.push({ from: accountName, coin_id: 'BTS', txn_date: Like(`${before}%`) });
          whereCondition.push({ to: accountName, coin_id: 'BTS',  txn_date: Like(`${before}%`) });
          before = moment(before, 'YYYY-MM-DD').subtract(1, 'days').format('YYYY-MM-DD');
        }
      }
      if(!query.days && txnType === 'sent') {
        whereCondition.push({ from: accountName, coin_id: 'BTS' });
      }
      if(query.days && txnType === 'sent'){
        for(let day = 1; day <= days; day++) {
          whereCondition.push({ from: accountName, coin_id: 'BTS', txn_date: Like(`${before}%`) });
          before = moment(before, 'YYYY-MM-DD').subtract(1, 'days').format('YYYY-MM-DD');
        }
      }
      if(!query.days && txnType === 'received') {
        whereCondition.push({ to: accountName, coin_id: 'BTS' });
      }
      if(query.days && txnType === 'received'){
        for(let day = 1; day <= days; day++) {
          whereCondition.push({ to: accountName, coin_id: 'BTS',  txn_date: Like(`${before}%`) });
          before = moment(before, 'YYYY-MM-DD').subtract(1, 'days').format('YYYY-MM-DD');
        }
      }

      if(offset < 0 || limit < 0){
        return reject(new BadRequestError('offset and limit must not be negative'));
      }
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new BadRequestError('Account does not exists'));
      }

      const connection = getConnection();
      const TransferRepository = connection.getRepository(Transfer);
      const transactions = await TransferRepository.find({
        where: whereCondition,
        order: {
          txn_date: order
        },
        skip: offset,
        take: limit
      });

      transactions.forEach(value => {
        value.amount = new BigNumber(value.amount).div(100000);
        value.coin_id = 'UDOO';
      });

      const transactionsCount = await TransferRepository.find({ where: whereCondition });

      return resolve({ transactions, totalPages: Math.ceil(transactionsCount.length / limit) });
    });

  createAccount = req =>
    new Promise((resolve, reject) => {
      if (!req.body.name) {
        return reject(new BadRequestError('Account name is required'));
      }
      if (req.body.name !== _.toLower(req.body.name)) {
        return reject(new BadRequestError('Account name must not contain upper case character'));
      }
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
          Apis.instance(btsWebSocketUrl, true) // TODO: Replace URL
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
              return this._getSignature(req, trBuff, registrarAccount);
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
              return connection.manager.save(user)
            })
            .then(async() => {
              let addresses = await new CommonAdapater().getAddress(req.headers, req.body.name);
              const connection = getConnection();
              const UserRepository = connection.getRepository(User);
              const user = await UserRepository.findOne({ vault_uuid: userUuidVault });
              user.bts_address = addresses.BTS;
              user.btc_address = addresses.BTC;
              user.eth_address = addresses.ETH;
              return connection.manager.save(user);
            })
            .then(user => resolve({ name: req.body.name, uuid: user.vault_uuid }))
            .catch(err => reject(new BadRequestError('Error in account creation')));
        })
        .catch(error => reject(new BadRequestError('Error while registering account to vault')));
    });

  transfer = req =>
    new Promise(async (resolve, reject) => {
      if (!req.body.fromAccount) {
        return reject(new BadRequestError('fromAccount is mandatory'));
      }
      if (!req.body.toAccount) {
        return reject(new BadRequestError('toAccount is mandatory'));
      }
      if (!req.body.sendAmount) {
        return reject(new BadRequestError('sendAmount is mandatory'));
      }
      const isSenderAccountExists = await this._getUuid(req.body.fromAccount);
      if (!isSenderAccountExists) {
        return reject(new BadRequestError('sender account does not exists'));
      }
      const isReceiverAccountExists = await this._getUuid(req.body.toAccount);
      if (!isReceiverAccountExists) {
        return reject(new BadRequestError('receiver account does not exists'));
      }
      let chainId, blockNo;
      const fromAccount = req.body.fromAccount;
      const toAccount = req.body.toAccount;
      const amount = new BigNumber(req.body.sendAmount).multipliedBy(100000).toNumber();
      const sendAmount = {
        amount,
        asset: "BTS"
      };
      let tr = new TransactionBuilder();
      Apis.instance(btsWebSocketUrl, true)
        .init_promise.then(res => {
          chainId = res[0].network.chain_id;
          return ChainStore.init();
        })
        .then(() =>
          Promise.all([
            FetchChain("getAccount", fromAccount === 'nathan' ? 'nathan' : `hwd${fromAccount}`),
            FetchChain("getAccount", toAccount === 'nathan' ? 'nathan' : `hwd${toAccount}`),
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
          return this._getSignature(req, trBuff, req.body.fromAccount);
        })
        .then(sign => {
          tr.signatures.push(sign);
          return tr.broadcast();
        })
        .then(async(res) => {
          blockNo = res[0].block_num;
          const connection = getConnection();
          const transfer = new Transfer();
          const price = await new EthereumAdapter().getPrice('UDOO', 'USD');
          const valueUSD = new BigNumber(req.body.sendAmount).multipliedBy(price.USD).toNumber();
          transfer.txn_id = res[0].id;
          transfer.from = fromAccount;
          transfer.to = toAccount;
          transfer.amount = amount;
          transfer.value_USD = valueUSD;
          transfer.coin_id = 'BTS';
          transfer.txn_status = 'CONFIRMED';
          transfer.txn_date = new Date();
          return connection.manager.save(transfer);
        })
        .then(async (txn) => {
          if(toAccount === 'nathan'){
            const address = await new EthereumAdapter().getAddress(req.headers, fromAccount);
            const url = `${BtsServiceBaseUrl}/bts-report-tx`;
            const body = { 'eth-wallet': address, amount };
            // return postRequest(url, body)
            //   .then(() => txn)
            //   .catch(reject);
          }
          return txn;
        })
        .then(txn => resolve({ TransactionId: txn.txn_id, blockNumber: blockNo }))
        .catch(err => reject(new BadRequestError('Error in Transaction')));
    });

  getPrice = (coin, query) =>
    new Promise((resolve, reject) => {
      if (coin !== 'BTS') {
        return reject(new BadRequestError('Coin and Blockchain mismatched'));
      }
      const currency = query.currency || 'USD';
      const url = `${priceBaseUrl}/data/price?fsym=${coin}&tsyms=${currency}`;
      const headers = { Apikey: priceApiKey };
      return getRequest(url, {}, headers)
        .then(result => {
          if (result.Response === 'Error' && result.Message === `There is no data for any of the toSymbols ${currency} .`) {
            return reject(new BadRequestError('Invalid Currency'));
          }
          return resolve({ coin, [currency]: result[currency] })
        })
        .catch(reject);
    });

  getStatus = (blockchain, txnId) =>
    new Promise(async (resolve, reject) => {
      const connection = getConnection();
      const TransferRepository = connection.getRepository(Transfer);
      const transaction = await TransferRepository.findOne({ txn_id: txnId, coin_id: blockchain });
      if (!transaction) {
        return reject(new BadRequestError('Transaction does not exists'));
      }
      return resolve(transaction);
    })

  _registerUserToVault = req =>
    new Promise((resolve, reject) => {
      const url = `${vaultBaseUrl}/api/register`;
      const headers = { "x-vault-token": vaultToken };
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
      const headers = { "x-vault-token": vaultToken };
      return postRequest(url, body, headers)
        .then(res => resolve(res.data.publicKey))
        .catch(reject);
    });

  _getUuid = async (accountName) => {
    if(accountName === 'nathan'){
      return nathanUuid;
    }
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: accountName });
    if (!registrar) return false;
    return registrar.vault_uuid;
  }

  _getSignature = (req, trHex, registrarAccount) =>
    new Promise(async (resolve, reject) => {
      const url = `${vaultBaseUrl}/api/signature`;
      const txDigest = {
        transactionDigest: trHex
      };
      const registrarUuid = registrarAccount === 'nathan' ? nathanUuid : await this._getUuid(registrarAccount);
      const body = {
        coinType: 240,
        path: "",
        payload: JSON.stringify(txDigest),
        uuid: registrarUuid
      };
      const headers = {
        "x-vault-token": vaultToken,
        "Content-Type": "application/json"
      };
      return postRequest(url, body, headers)
        .then(res => resolve(res.data.signature))
        .catch(reject);
    });

  _getAccountId = accountName =>
    new Promise((resolve, reject) => {
      const body = prepareBody([0, "lookup_account_names", [[accountName]]]);
      const url = `${BTSBaseUrl}/account_id?account_name=${accountName}`;
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
      const url = `${BTSBaseUrl}/rpc`;
      return postRequest(url, body)
        .then(response => {
          const balance = response.result[0].amount;
          resolve(balance);
        })
        .catch(reject);
    });

}

export default BitsharesAdapter;
