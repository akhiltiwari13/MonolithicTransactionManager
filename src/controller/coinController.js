import Responder from '../lib/expressResponder';

export default class CoinController {
  static getPrice = (req, res) =>
    req.adapter
      .getPrice(req.params.coinId, req.query)
      .then(result => Responder.success(res, result))
      .catch(error => Responder.operationFailed(res, error));
};
