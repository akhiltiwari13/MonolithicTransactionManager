import request from "request";
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import envConfig from "../../config/envConfig";

const vaultBaseUrl = envConfig.get("vaultBaseUrl");

const _registerUserToVault = req =>
  new Promise((resolve, reject) => {
    return request.post(
      {
        url: `${vaultBaseUrl}/api/register`,
        headers: { "x-vault-token": req.headers["x-vault-token"] }
      },
      (err, response, body) => {
        if (err) reject(err);
        resolve(body);
      }
    );
  });

const _getPublicKey = (req, uuid) =>
  new Promise((resolve, reject) => {
    const body = {
      coinType: 240,
      path: "",
      uuid
    };
    return request.post(
      {
        url: `${vaultBaseUrl}/api/address`,
        headers: { "x-vault-token": req.headers["x-vault-token"] },
        json: body
      },
      (err, response, body) => {
        if (err) reject(err);
        resolve(body.data.publicKey);
      }
    );
  });

const processCreateAccount = req =>
  new Promise((resolve, reject) => {
    let userUuid, publicKey, chainId;
    return _registerUserToVault(req)
      .then(result => {
        userUuid = JSON.parse(result).data.uuid;
        return _getPublicKey(req, userUuid);
      })
      .then(pubKey => {
        let tr = new TransactionBuilder();
        let fromAccount = "nathan";
        let accountName = req.body.name;
        publicKey = pubKey;
        Apis.instance("ws://192.168.10.81:11011", true) // TODO: Replace URL
          .init_promise.then(res => {
            chainId = res[0].network.chain_id;
            return ChainStore.init();
          })
          .then(() => Promise.all([FetchChain("getAccount", fromAccount)]))
          .then(res => {
            let [fromAccount] = res;

            /* Account Create */
            tr.add_type_operation("account_create", {
              referrer_percent: 0,
              registrar: fromAccount.get("id"),
              referrer: fromAccount.get("id"),
              name: accountName,
              owner: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[publicKey, 1]],
                address_auths: []
              },
              active: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[publicKey, 1]],
                address_auths: []
              },
              options: {
                memo_key: publicKey,
                voting_account: "1.2.5",
                num_witness: 0,
                num_committee: 0,
                votes: [],
                extensions: []
              }
            });
            /* Account Create */

            tr.set_required_fees();
          })
          .then(() => tr.finalize())
          .then(() => {
            const tr_buff = Buffer.concat([
              new Buffer(chainId, "hex"),
              tr.tr_buffer
            ]);
            const trBuff = tr_buff.toString("hex");
            return _getSignature(trBuff);
          })
          .then(sign => {
            tr.signatures.push(sign);
            return tr.broadcast();
          })
          .then(res => {
            resolve(res[0].id);
          })
          .catch(reject);
      })
      .catch(reject);
  });

const _getSignature = trHex =>
  new Promise((resolve, reject) => {
    const txDigest = {
      transactionDigest: trHex
    };
    const object = {
      coinType: 240,
      path: "",
      payload: JSON.stringify(txDigest),
      uuid: "bg8djldgouhs70pq31r0" // TODO: fetch from database
    };
    return request.post(
      {
        url: `${vaultBaseUrl}/api/signature`,
        headers: { "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s" },
        json: object
      },
      (err, response, body) => {
        if (err) reject(err);
        resolve(body.data.signature);
      }
    );
  });

export default processCreateAccount;
