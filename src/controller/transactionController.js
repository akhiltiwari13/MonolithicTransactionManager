import Responder from '../lib/expressResponder';

export default class TransactionController {
  static transaction = (req, res) =>
    req.adapter
      .transfer(req)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));

  static status = (req, res) =>
    req.adapter
      .getStatus(req.headers.blockchain, req.params.txnId)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));
};

