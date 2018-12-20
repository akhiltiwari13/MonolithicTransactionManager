import { getRequest, postRequest } from "../lib/request";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { User } from "../entity/user";
import { Transfer } from "../entity/transfer";

const btcThirdPartyUrl = envConfig.get('btcBaseUrl');
const btcEnvironment = envConfig.get('env');
const vaultBaseUrl = envConfig.get("vaultBaseUrl");

class BitcoinAdapater {

  constructor(address) {
    this.address = address;
  }

  getBalance = address =>
    new Promise((resolve, reject) => {
      const url = `${btcThirdPartyUrl}/addr/${address}/balance`;
      return getRequest(url)
        .then(balance => resolve({ address, balance: balance / 100000000, unit: 'BTC' }))
        .catch(reject)
    });

  getTransactionHistory = address =>
    new Promise((resolve, reject) => {
      const url = `${btcThirdPartyUrl}/txs/?address=${address}`;
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

  _registerUserToVault = req =>
    new Promise((resolve, reject) => {
      const url = `${vaultBaseUrl}/api/register`;
      const headers = { "x-vault-token": req.headers["x-vault-token"] };
      return postRequest(url, req.body, headers)
        .then(resolve)
        .catch(reject);
    });

  // _getPublicKey = (req, uuid, coinId) =>
  //   new Promise((resolve, reject) => {
  //     const body = {
  //       coinType: coinId,
  //       path: `m/44'/${coinId}'/0'/0/0`,
  //       uuid
  //     };
  //     const url = `${vaultBaseUrl}/api/address`;
  //     const headers = { "x-vault-token": req.headers["x-vault-token"] };
  //     return postRequest(url, body, headers)
  //       .then(res => resolve(res.data))
  //       .catch(reject);
  //   });
}

export default BitcoinAdapater;
