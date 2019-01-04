import Responder from '../lib/expressResponder';

export default class UserController {
  static getBalance = (req, res) => {
    const accountName = req.params.userId;
    return req.adapter
      .getBalance(req.headers, accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));
  };

  static getTransactionHistory = (req, res) => {
    const accountName = req.params.userId;
    return req.adapter
      .getTransactionHistory(accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));
  };

  static registerUser = (req, res) => {
    return req.adapter
      .createAccount(req)
      .then(result => Responder.success(res, result ))
      .catch(error => Responder.operationFailed(res, error));
  };
}
