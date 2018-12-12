import Responder from "../../src/lib/expressResponder";
import requestProcessor from "../requestProcessor";

export default class Controller {
  static getBalance = (req, res) => {
    const accountName = req.params.userId;
    return requestProcessor.processGetBalance(accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));
  };

  static getTransactionHistory = (req, res) => {
    const accountName = req.params.userId;
    return requestProcessor.processGetTransactionHistory(accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));
  };

  static transferBalance = (req, res) => {
    Responder.success(res, "Called transferBalance");
  };

  static registerUser = (req, res) => {
    return requestProcessor
      .processCreateAccount(req)
      .then(result => Responder.success(res, { TranscationId: result }))
      .catch(error => Responder.operationFailed(res, error));
  };
}
