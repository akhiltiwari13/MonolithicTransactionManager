import { getRequest, postRequest } from "../lib/request";
import prepareBody from "../utility/requestBody"
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import _ from "lodash";
import envConfig from "../../config/envConfig";


const baseUrl = envConfig.get("baseUrl"); // get websocket url from config file.

const processGetTransactionHistory = accountName =>
new Promise((resolve, reject) => {
  return Apis.instance("ws://192.168.10.81:11011", true) // TODO: Replace URL from a value from config file
    .init_promise.then(res => {
      return ChainStore.init();
    })
    .then(() => Promise.all([FetchChain("fetchFullAccount", "1.2.17")]))
    .then(res => {
      let [fullAccountHistory] = res;
      console.log("res: ", fullAccountHistory)
      resolve(fullAccountHistory.get("history"));
    })
    .catch(reject);
})
export default processGetTransactionHistory;
