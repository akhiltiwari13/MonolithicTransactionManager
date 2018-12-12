import getRequest from "../lib/request";
import _ from "lodash";

const baseUrl = "http://185.208.208.184:5000";

const processGetBalance = accountName =>
  new Promise((resolve, reject) =>
    _getAccountId(accountName)
      .then(accountId => _getAccountBalance(accountId))
      .then(balance => {
        resolve({ accountName, balance, unit: "BTS" });
      })
      .catch(reject)
  );

const _getAccountId = accountName =>
  new Promise((resolve, reject) => {
    const url = `${baseUrl}/account_id?account_name=${accountName}`;
    return getRequest(url)
      .then(resolve)
      .catch(reject);
  });

const _getAccountBalance = accountId =>
  new Promise((resolve, reject) => {
    const url = `${baseUrl}/full_account?account_id=${accountId}`;
    return getRequest(url)
      .then(res => {
        const response = _.flatten(res);
        const balance = response[1].statistics.core_in_balance / 100000;
        resolve(balance);
      })
      .catch(reject);
  });

export default processGetBalance;
