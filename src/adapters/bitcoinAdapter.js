import { getRequest, postRequest } from "../lib/request";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { User } from "../entity/user";
import { BigNumber } from 'bignumber.js'
import { Transfer } from "../entity/transfer";
import { TransactionBuilder, networks } from 'bitcoinjs-lib';
import _ from 'lodash';
import { ParameterInvalidError } from '../errors'

const btcEnvironment = envConfig.get('env');
const priceBaseUrl = envConfig.get("priceBaseUrl");
const btcBaseUrl = btcEnvironment === 'development' ? envConfig.get('btcTestBaseUrl') : envConfig.get('btcMainBaseUrl');
const vaultBaseUrl = envConfig.get("vaultBaseUrl");

class BitcoinAdapater {

  constructor(address) {
    this.address = address;
  }

  getBalance = (headers, accountName) =>
    new Promise(async (resolve, reject) => {
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new ParameterInvalidError('Account does not exists'));
      }
      return this._getPublicAddress(headers, accountName)
        .then(result => {
          const address = result.address;
          const url = `${btcBaseUrl}/addr/${address}/balance`;
          return getRequest(url)
            .then(balance => resolve({ accountName, balance: balance / 100000000, unit: 'BTC' }))
            .catch(reject)
        })
        .catch(reject)
    });

  getTransactionHistory = (headers, accountName) =>
    new Promise(async (resolve, reject) => {
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new ParameterInvalidError('Account does not exists'));
      }
      return this._getPublicAddress(headers, accountName)
        .then(result => {
          const address = result.address;
          const url = `${btcBaseUrl}/txs/?address=${address}`;
          return getRequest(url)
            .then(txnHistory => resolve({ address, txnHistory }))
            .catch(reject)
        })
        .catch(reject)
    });

  transfer = req =>
    new Promise((resolve, reject) => {
      let estimateFee, balance, senderAddress, receiverAddress;
      const senderAccountName = req.body.fromAccount;
      const receiverAccountName = req.body.toAccount;
      const sendAmount = req.body.sendAmount;

      return this._getPublicAddress(req.headers, senderAccountName)
        .then(result => {
          senderAddress = result.address;
          return this._getPublicAddress(req.headers, receiverAccountName)
        })
        .then(result => {
          receiverAddress = result.address;
          return this._estimateFee()
        })
        .then(feeInSatoshis => {
          estimateFee = feeInSatoshis;
          return this._getBalance(senderAddress);
        })
        .then(balanceInSatoshis => {
          balance = balanceInSatoshis;
          return this._getUtxo(senderAddress);
        })
        .then(async (utxos) => {
          const res = await this._makeRawTransaction(senderAddress, parseInt(balance), utxos, receiverAddress, estimateFee, sendAmount)
          return this._getSignature(res.payload, senderAccountName)
        })
        .then(signedTx => this._broadcastTx(signedTx))
        .then(res => {
          const connection = getConnection();
          const transfer = new Transfer();
          transfer.txn_id = res.txid;
          transfer.from = senderAccountName;
          transfer.to = receiverAccountName;
          transfer.amount = sendAmount * 100000000;
          transfer.coin_id = 'BTC';
          transfer.txn_status = 'PENDING';
          return connection.manager.save(transfer);
        })
        .then(txn => resolve(txn.txn_id))
        .catch(reject);
    })

  getPrice = (coin, query) =>
    new Promise((resolve, reject) => {
      if (coin !== 'BTC') {
        return reject(new ParameterInvalidError('Coin and Blockchain mismatched'));
      }
      const currency = query.currency || 'USD';
      const url = `${priceBaseUrl}/data/price?fsym=${coin}&tsyms=${currency}`;
      const headers = { Apikey: 'f212d4142590ea9d2850d73ab9bb78b6f414da4613786c6a83b7e764e7bf67f7' };
      return getRequest(url, {}, headers)
        .then(result => {
          if (result.Response === 'Error' && result.Message === `There is no data for any of the toSymbols ${currency} .`) {
            return reject(new ParameterInvalidError('Invalid Currency'));
          }
          return resolve({ coin, [currency]: result[currency] })
        })
        .catch(reject);
    });

  _makeRawTransaction = async (senderAddress, balance, utxos, receiverAddress, estimateFee, sendAmount) => {
    const blockchainNetworkBitcoinjsLib = envConfig.get('env') === 'production' ? networks.bitcoin : networks.testnet
    const payload = { inputs: [], outputs: [] }
    const tx = new TransactionBuilder(blockchainNetworkBitcoinjsLib)
    const totalAmountToSend = new BigNumber(sendAmount).multipliedBy(100000000).toNumber();
    let totalInput = 0
    let totalUTXOEntered = 0
    let i = 0
    let bitcoinTransactionFee = (34 * 10) * (Math.round(estimateFee / 1000))
    for (i = 0; i < utxos.length; i += 1) {
      const currentUtxo = utxos[i]
      totalInput = totalInput + parseInt(currentUtxo.satoshis, 10)
      const txHashRaw = await this._getRawOfTxHash(currentUtxo.txid)
      tx.addInput(currentUtxo.txid, currentUtxo.vout)
      payload.inputs.push({ txhash: currentUtxo.txid, vout: currentUtxo.vout, txHashRaw: txHashRaw.rawtx })
      bitcoinTransactionFee += (180 + 1) * (Math.round(estimateFee / 1000))
      if (totalInput > totalAmountToSend + bitcoinTransactionFee) {
        totalUTXOEntered = i
        break
      }
    }
    if (balance < totalAmountToSend + bitcoinTransactionFee) {
      throw new BadRequestError('Insufficient Balance for Fee')
    };
    const amountToKeep = totalInput - (totalAmountToSend + bitcoinTransactionFee);
    payload.outputs.push({ address: receiverAddress, amount: totalAmountToSend });
    tx.addOutput(receiverAddress, totalAmountToSend);
    tx.addOutput(senderAddress, amountToKeep);
    payload.outputs.push({ address: senderAddress, amount: parseInt(amountToKeep) })
    const filterPayload = {
      inputs: _.map(payload.inputs, (x) => _.omit(x, 'txHashRaw')),
      outputs: payload.outputs
    }
    return { payload: filterPayload, rawtx: tx.buildIncomplete().toHex(), allPayloadData: payload, coinType: envConfig.get('env') === 'production' ? 0 : 1 }
  };

  _broadcastTx = signedTx =>
    new Promise((resolve, reject) => {
      const body = {
        rawtx: signedTx
      }
      const url = `${btcBaseUrl}/tx/send`;
      return postRequest(url, body)
        .then(resolve)
        .catch(reject)
    })

  _getUuid = async (accountName) => {
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: accountName });
    if (!registrar) return false;
    return registrar.vault_uuid;
  }

  _getSignature = (txPayload, senderName) =>
    new Promise(async (resolve, reject) => {
      const url = `${vaultBaseUrl}/api/signature`;
      const senderUuid = await this._getUuid(senderName);
      const coinId = envConfig.get('env') === 'development' ? 1 : 0;
      const body = {
        coinType: coinId,
        path: `m/44'/${coinId}'/0'/0/0`,
        payload: JSON.stringify(txPayload),
        uuid: senderUuid
      };
      const headers = {
        "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s",
        "Content-Type": "application/json"
      };
      return postRequest(url, body, headers)
        .then(res => resolve(res.data.signature))
        .catch(reject);
    });

  _getRawOfTxHash = txId =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/rawtx/${txId}`;
      return getRequest(url)
        .then(resolve)
        .catch(reject)
    });

  _getUtxo = address =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/addr/${address}/utxo`;
      return getRequest(url)
        .then(resolve)
        .catch(reject)
    })

  _estimateFee = () =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/utils/estimatefee`;
      return getRequest(url)
        .then(fee => {
          const feeInSatoshis = new BigNumber(fee['2']).multipliedBy(100000000).toNumber();
          return resolve(feeInSatoshis)
        })
        .catch(reject)
    });

  _getBalance = address =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/addr/${address}/balance`;
      return getRequest(url)
        .then(result => {
          const balance = new BigNumber(result).toNumber();
          return resolve(balance);
        })
        .catch(reject)
    })

  _registerUserToVault = req =>
    new Promise((resolve, reject) => {
      const url = `${vaultBaseUrl}/api/register`;
      const headers = { "x-vault-token": req.headers["x-vault-token"] };
      return postRequest(url, req.body, headers)
        .then(resolve)
        .catch(reject);
    });

  _getPublicAddress = (headers, accountName) =>
    new Promise(async (resolve, reject) => {
      const senderUuid = await this._getUuid(accountName);
      const coinId = envConfig.get('env') === 'development' ? 1 : 0;
      const body = {
        coinType: coinId,
        path: `m/44'/${coinId}'/0'/0/0`,
        uuid: senderUuid
      };
      const url = `${vaultBaseUrl}/api/address`;
      headers = { "x-vault-token": headers["x-vault-token"] };
      return postRequest(url, body, headers)
        .then(res => resolve(res.data))
        .catch(reject);
    });
}

export default BitcoinAdapater;
