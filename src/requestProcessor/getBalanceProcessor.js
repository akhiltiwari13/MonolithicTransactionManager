import { postRequest } from "../lib/request";
import prepareBody from "../utility/requestBody";

import _ from "lodash";
import envConfig from "../../config/envConfig";

const baseUrl = envConfig.get("baseUrl");

const processGetBalance = accountName =>
  new Promise((resolve, reject) =>
    _getAccountId(`hwd${accountName}`)
      .then(accountId => _getAccountBalance(accountId))
      .then(balance => {
        balance = balance / 100000;
        resolve({ accountName, balance, unit: "BTS" });
      })
      .catch(reject)
  );

const _getAccountId = accountName =>
  new Promise((resolve, reject) => {
    const body = prepareBody([0, "lookup_account_names", [[accountName]]]);
    const url = `${baseUrl}/account_id?account_name=${accountName}`;
    return postRequest(url, body)
      .then(response => {
        const accountId = response.result[0].id;
        resolve(accountId);
      })
      .catch(reject);
  });

const _getAccountBalance = accountId =>
  new Promise((resolve, reject) => {
    const body = prepareBody([
      0,
      "get_account_balances",
      [accountId, ["1.3.0"]]
    ]); //hardcoded to get the BTS balance
    const url = `${baseUrl}/rpc`;
    return postRequest(url, body)
      .then(response => {
        const balance = response.result[0].amount;
        resolve(balance);
      })
      .catch(reject);
  });

export default processGetBalance;
