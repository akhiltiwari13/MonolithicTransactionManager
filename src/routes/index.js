import { runInNewContext } from "vm";

const transferBalance = (req, res) => {
  res.send({ Message: "Called Transfer balance" });
};

const registerUser = (req, res) => {
  res.send({ Message: "Called Register User" });
};

const _checkAuthentication = (req, res, next) => {
  // TODO: check authentication
  next();
};

const initRoutes = app => {
  app.post("/transfer", _checkAuthentication, transferBalance);
  app.post("/registerUser", _checkAuthentication, registerUser);
};

export default initRoutes;
