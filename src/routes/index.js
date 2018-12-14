import Controller from "../controller";

const _checkAuthentication = (req, res, next) => {
  // TODO: check authentication
  next();
};

const initRoutes = app => {
  app.get(
    "/user/:userId/getBalance",
    _checkAuthentication,
    Controller.getBalance
  );
  app.get(
    "/user/:userId/getTransactionHistory",
    _checkAuthentication,
    Controller.getTransactionHistory
  );
  app.post("/transfer", _checkAuthentication, Controller.transferBalance);
  app.post("/registerUser", _checkAuthentication, Controller.registerUser);
};

export default initRoutes;
