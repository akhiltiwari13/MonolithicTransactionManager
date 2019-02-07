import { getConnection } from "typeorm";
import async from 'async';
import { User } from "../entity/user";
import BitcoinAdapter from "./bitcoinAdapter";
import EthereumAdapter from "./ethereumAdapter";
import BitsharesAdapter from "./bitsharesAdapter";
import { BadRequestError } from '../errors';
import envConfig from "../../config/envConfig";
import { getRequest } from "../lib/request";

const priceBaseUrl = envConfig.get("priceBaseUrl");

class CommonAdapater {

  constructor(address) {
    this.address = address;
  }

  getBalance = (headers, accountName) =>
    new Promise(async (resolve, reject) => {
      let balanceObject = {}
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new BadRequestError('Account does not exists'));
      }
      const coinsPrice = await this.getPrice('ALL', 'USD');
      return async.eachLimit(['BTC', 'UDOO', 'ETH'], 3, async (coin, done) => {
        if (coin === 'BTC') {
          let btcBalance = await new BitcoinAdapter().getBalance(headers, accountName);
          btcBalance = Object.assign({
            price: coinsPrice.BTC.price,
            '%change': coinsPrice.BTC['%change']
          }, btcBalance);
          balanceObject = Object.assign({ [coin]: btcBalance }, balanceObject);
        }
        if (coin === 'ETH') {
          let ethBalance = await new EthereumAdapter().getBalance(headers, accountName);
          ethBalance = Object.assign({
            price: coinsPrice.ETH.price,
            '%change': coinsPrice.ETH['%change']
          }, ethBalance);
          balanceObject = Object.assign({ [coin]: ethBalance }, balanceObject)
        }
        if (coin === 'UDOO') {
          let btsBalance = await new BitsharesAdapter().getBalance(headers, accountName);
          btsBalance = Object.assign({
            price: coinsPrice.UDOO.price,
            '%change': coinsPrice.UDOO['%change']
          }, btsBalance);
          balanceObject = Object.assign({ [coin]: btsBalance }, balanceObject)
        }
        done();
      }, err => err ? reject(err) : resolve(balanceObject))
    });

  getAddress = (headers, accountName) =>
    new Promise(async (resolve, reject) => {
      let addressObject = {}
      const isAccountExists = await this._getUuid(accountName);
      if (!isAccountExists) {
        return reject(new BadRequestError('Account does not exists'));
      }
      return async.eachLimit(['BTC', 'BTS', 'ETH'], 3, async (coin, done) => {
        if (coin === 'BTC') {
          const btcAddress = await new BitcoinAdapter().getAddress(headers, accountName);
          addressObject = Object.assign({ [coin]: btcAddress.BTC }, addressObject)
        }
        if (coin === 'ETH') {
          const ethAddress = await new EthereumAdapter().getAddress(headers, accountName);
          addressObject = Object.assign({ [coin]: ethAddress.ETH }, addressObject)
        }
        if (coin === 'BTS') {
          const btsAddress = await new BitsharesAdapter().getAddress(headers, accountName);
          addressObject = Object.assign({ [coin]: btsAddress.BTS }, addressObject)
        }
        done();
      }, err => err ? reject(err) : resolve(addressObject))
    });

  getPrice = (coin, query) =>
    new Promise((resolve, reject) => {
      let resultObj = {};
      if (coin !== 'ALL') {
        return reject(new BadRequestError('Coin and Blockchain mismatched'));
      }
      coin = 'BTC,ETH,UDOO'
      const currency = query.currency || 'USD';
      const url = `${priceBaseUrl}/data/pricemultifull?fsyms=${coin}&tsyms=${currency}`;
      const headers = { Apikey: 'f212d4142590ea9d2850d73ab9bb78b6f414da4613786c6a83b7e764e7bf67f7' };
      return getRequest(url, {}, headers)
        .then(result => {
          if (result.Response === 'Error' && result.Message === `There is no data for any of the toSymbols ${currency} .`) {
            return reject(new BadRequestError('Invalid Currency'));
          }
          return resolve(this._prepareResult(result.DISPLAY, currency));
        })
        .catch(reject);
    });

  _prepareResult = (result, currency) => {
    let resultObj = {};
    const coins = ['BTC', 'ETH', 'UDOO'];
    for (let coinIndex = 0; coinIndex < 3; coinIndex++) {
      resultObj = Object.assign({
        [coins[coinIndex]]: {
          price: result[coins[coinIndex]][currency].PRICE,
          '%change': result[coins[coinIndex]][currency].CHANGEPCT24HOUR
        }
      }, resultObj);
    }
    return resultObj;
  }

  _getUuid = async (accountName) => {
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: accountName });
    if (!registrar) return false;
    return registrar.vault_uuid;
  }

}

export default CommonAdapater;
