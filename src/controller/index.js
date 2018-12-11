
export default class Controller {
  static transferBalance = (req, res) => {
    res.send({ Message: "Called Transfer balance" });
  };

  static registerUser = (req, res) => {
    res.send({ Message: "Called Register User" });
  };
}
