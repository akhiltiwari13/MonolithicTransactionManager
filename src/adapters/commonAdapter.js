import { getConnection } from "typeorm";
import async from 'async';
import { User } from "../entity/user";
import BitcoinAdapter from "./bitcoinAdapter";
import EthereumAdapter from "./ethereumAdapter";
import BitsharesAdapter from "./bitsharesAdapter";
import { BadRequestError } from '../errors';

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
      return async.eachLimit(['BTC', 'BTS', 'ETH'], 3, async (coin, done) => {
        if (coin === 'BTC') {
          const btcBalance = await new BitcoinAdapter().getBalance(headers, accountName);
          balanceObject = Object.assign({ [coin]: btcBalance }, balanceObject)
        }
        if (coin === 'ETH') {
          const ethBalance = await new EthereumAdapter().getBalance(headers, accountName);
          balanceObject = Object.assign({ [coin]: ethBalance }, balanceObject)
        }
        if (coin === 'BTS') {
          const btsBalance = await new BitsharesAdapter().getBalance(headers, accountName);
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

  _getUuid = async (accountName) => {
    const connection = getConnection();
    const UserRepository = connection.getRepository(User);
    const registrar = await UserRepository.findOne({ name: accountName });
    if (!registrar) return false;
    return registrar.vault_uuid;
  }

}

export default CommonAdapater;
