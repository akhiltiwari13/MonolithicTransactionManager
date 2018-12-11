import Controller from "../controller";

const _checkAuthentication = (req, res, next) => {
  // TODO: check authentication
  next();
};

const initRoutes = app => {
  app.post("/transfer", _checkAuthentication, Controller.transferBalance);
  app.post("/registerUser", _checkAuthentication, Controller.registerUser);
};

export default initRoutes;
