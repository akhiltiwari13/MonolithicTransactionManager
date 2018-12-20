import { getRequest, postRequest } from "../lib/request";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { User } from "../entity/user";
import { BigNumber } from 'bignumber.js'
import { Transfer } from "../entity/transfer";
import { TransactionBuilder, networks } from 'bitcoinjs-lib';
import _ from 'lodash';

const btcEnvironment = envConfig.get('env');
const btcBaseUrl = btcEnvironment === 'development' ? envConfig.get('btcTestBaseUrl') : envConfig.get('btcMainBaseUrl');
const vaultBaseUrl = envConfig.get("vaultBaseUrl");

class BitcoinAdapater {

  constructor(address) {
    this.address = address;
  }

  getBalance = address =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/addr/${address}/balance`;
      return getRequest(url)
        .then(balance => resolve({ address, balance: balance / 100000000, unit: 'BTC' }))
        .catch(reject)
    });

  getTransactionHistory = address =>
    new Promise((resolve, reject) => {
      const url = `${btcBaseUrl}/txs/?address=${address}`;
      return getRequest(url)
        .then(txnHistory => resolve({ address, txnHistory }))
        .catch(reject)
    });

  createAccount = req =>
    new Promise((resolve, reject) => this._registerUserToVault(req)
      .then(result => {
        const connection = getConnection();
        const user = new User();
        user.name = req.body.name;
        user.vault_uuid = result.data.uuid;;
        return connection.manager.save(user)
      })
      .then(user => resolve({ name: req.body.name, uuid: user.vault_uuid }))
      .catch(reject))

  transfer = req =>
    new Promise((resolve, reject) => {
      let estimateFee, balance;
      const senderAddress = req.body.fromAccount;
      const receiverAddress = req.body.toAccount;
      const sendAmount = req.body.sendAmount;

      return this._estimateFee()
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
          return this._getSignature(res.payload, senderAddress)
        })
        .then(signedTx => this._broadcastTx(signedTx))
        .then(res => resolve(res.txid))
        .catch(reject)
    })

  _makeRawTransaction = async (senderAddress, balance, utxos, receiverAddress, estimateFee, sendAmount) => {
    const blockchainNetworkBitcoinjsLib = envConfig.get('env') === 'production' ? networks.bitcoin : networks.testnet
    const payload = { inputs: [], outputs: [] }
    const tx = new TransactionBuilder(blockchainNetworkBitcoinjsLib)
    const totalAmountToSend = new BigNumber(sendAmount).multipliedBy(100000000).toNumber();
    let totalInput = 0
    let totalUTXOEntered = 0
    let i = 0
    let bitcoinTransactionFee = (34 * 2 + 10) * (Math.round(estimateFee / 1000))
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

  _getUuid = async (registrarAccount) => {
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: registrarAccount });
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

  _getPublicAddress = (req, senderName) =>
    new Promise(async (resolve, reject) => {
      const senderUuid = await this._getUuid(senderName);
      const coinId = envConfig.get('env') === 'development' ? 1 : 0;
      const body = {
        coinType: coinId,
        path: `m/44'/${coinId}'/0'/0/0`,
        uuid: senderUuid
      };
      const url = `${vaultBaseUrl}/api/address`;
      const headers = { "x-vault-token": req.headers["x-vault-token"] };
      return postRequest(url, body, headers)
        .then(res => resolve(res.data))
        .catch(reject);
    });
}

export default BitcoinAdapater;
