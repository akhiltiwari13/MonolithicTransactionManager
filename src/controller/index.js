import Responder from "../../src/lib/expressResponder";
import processGetBalance from "../requestProcessor";

export default class Controller {
  static getBalance = (req, res) => {
    const accountName = req.params.userId;
    return processGetBalance(accountName)
      .then(balanceObject => Responder.success(res, balanceObject))
      .catch(error => Responder.operationFailed(res, error));
  };

  static transferBalance = (req, res) => {
    Responder.success(res, "Called transferBalance");
  };

  static registerUser = (req, res) => {
    Responder.success(res, "Called registerUser");
  };
}
