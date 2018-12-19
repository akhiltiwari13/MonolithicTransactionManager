import { getRequest } from "../lib/request";
import envConfig from "../../config/envConfig";

const btcThirdPartyUrl = envConfig.get('btcBaseUrl');

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
    })

  getTransactionHistory = address =>
    new Promise((resolve, reject) => {
      const url = `${btcThirdPartyUrl}/txs/?address=${address}`;
      return getRequest(url)
        .then(txnHistory => resolve({ address, txnHistory }))
        .catch(reject)
    })
}

export default BitcoinAdapater;
