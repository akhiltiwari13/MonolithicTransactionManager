import Responder from '../lib/expressResponder';
import * as Adapters from '../adapters';

export default class CoinController {
  static getPrice = (req, res) =>
    req.adapter
      .getPrice(req.params.coinId, req.query)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));

  static convertAddress = (req, res) => {
    req.adapter = Adapters.getBlockchain('ALL');
    return req.adapter
      .convertAddress(req.query)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));
  }
};
