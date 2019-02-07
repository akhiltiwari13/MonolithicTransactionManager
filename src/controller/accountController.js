import Responder from '../lib/expressResponder';
import * as Adapters from '../adapters';

export default class AccountController {
  static getBalance = (req, res) =>
    req.adapter
      .getBalance(req.headers, req.params.accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));

  static getTxnHistory = (req, res) =>
    req.adapter
      .getTransactionHistory(req.headers, req.params.accountName, req.query.offset, req.query.limit)
      .then(txnObject => Responder.success(res, txnObject))
      .catch(error => Responder.operationFailed(res, error));

  static getAddress = (req, res) =>
    req.adapter
      .getAddress(req.headers, req.params.accountName)
      .then(addressObject => Responder.success(res, addressObject))
      .catch(error => Responder.operationFailed(res, error));

  static createAccount = (req, res) => {
    req.adapter = Adapters.getBlockchain('BTS');
    return req.adapter
      .createAccount(req)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));
  }
};
