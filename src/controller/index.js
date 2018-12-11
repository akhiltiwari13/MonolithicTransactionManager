import Responder from "../../src/lib/expressResponder";

export default class Controller {
  static transferBalance = (req, res) => {
    Responder.success(res, "Called transferBalance");
  };

  static registerUser = (req, res) => {
    Responder.success(res, "Called registerUser");
  };
}
