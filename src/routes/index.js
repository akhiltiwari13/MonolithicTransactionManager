import { AccountController, TransactionController, HealthController, CoinController, CommonController } from "../controller";
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
  // Health Check Routes
  app.get('/healthCheck', _checkAuthentication, HealthController.getStatus);

  // Coin Routes
  app.get('/coin/:coinId/price', _checkAuthentication, _getBlockChain, CoinController.getPrice);
  app.get('/coin/convertAddress', _checkAuthentication, _getBlockChain, CoinController.convertAddress);

  // Account Routes
  app.get("/account/:accountName/balance", _checkAuthentication, _getBlockChain, AccountController.getBalance);
  app.get("/account/:accountName/txnHistory", _checkAuthentication, _getBlockChain, AccountController.getTxnHistory);
  app.get("/account/:accountName/address", _checkAuthentication, _getBlockChain, AccountController.getAddress);
  app.post("/account", _checkAuthentication, AccountController.createAccount);

  // Account Routes (Common)
  // app.get("/account/:accountName/address", _checkAuthentication, _getBlockChain, CommonController.allAddress);

  // Transfer/Transaction Routes
  app.get("/transaction/:txnId/status", _checkAuthentication, _getBlockChain, TransactionController.status);
  app.post("/transaction", _checkAuthentication, _getBlockChain, TransactionController.transaction);
};

export default initRoutes;
