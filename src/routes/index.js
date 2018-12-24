import { UserController, TransferController, HealthController, CoinController } from "../controller";
import * as Adapters from '../adapters';

const _checkAuthentication = (req, res, next) => {
  // TODO: check authentication
  next();
};

const _getBlockChain = (req, res, next) => {
  req.adapter = Adapters.getBlockchain(req.headers["blockchain"]);
  next();
};

const initRoutes = app => {
  app.get('/healthCheck', _checkAuthentication, HealthController.getStatus);
  app.get('/coin/:coinId/price', _checkAuthentication, _getBlockChain, CoinController.getPrice);
  app.get("/user/:userId/balance", _checkAuthentication, _getBlockChain, UserController.getBalance);
  app.get("/user/:userId/transactionHistory", _checkAuthentication, _getBlockChain, UserController.getTransactionHistory);
  app.post("/transfer", _checkAuthentication, _getBlockChain, TransferController.transferBalance);
  app.post("/registerUser", _checkAuthentication, _getBlockChain, UserController.registerUser);
};

export default initRoutes;
