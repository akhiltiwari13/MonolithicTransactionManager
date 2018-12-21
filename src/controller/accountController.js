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
      .getTransactionHistory(req.headers, req.params.accountName)
      .then(txnObject => Responder.success(res, txnObject))
      .catch(error => Responder.operationFailed(res, error));

  static createAccount = (req, res) =>{
    req.adapter = Adapters.getBlockchain('BTS');
    return req.adapter
      .registerUser(req)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));
  }
};
