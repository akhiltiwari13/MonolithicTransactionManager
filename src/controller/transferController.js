import Responder from '../lib/expressResponder';

export default class TransferController {
  static transferBalance = (req, res) =>
    req.adapter
      .transfer(req)
      .then(result => Responder.success(res, { TranscationId: result }))
      .catch(error => Responder.operationFailed(res, error));
};

