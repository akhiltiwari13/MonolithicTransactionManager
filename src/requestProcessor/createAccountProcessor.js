import { postRequest } from "../lib/request";
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { User } from "../entity/user";

const vaultBaseUrl = envConfig.get("vaultBaseUrl");

const _registerUserToVault = req =>
  new Promise((resolve, reject) => {
    const url = `${vaultBaseUrl}/api/register`;
    const headers = { "x-vault-token": req.headers["x-vault-token"] };
    return postRequest(url, {}, headers)
      .then(resolve)
      .catch(reject);
  });

const _getPublicKey = (req, uuid) =>
  new Promise((resolve, reject) => {
    const body = {
      coinType: 240,
      path: "",
      uuid
    };
    const url = `${vaultBaseUrl}/api/address`;
    const headers = { "x-vault-token": req.headers["x-vault-token"] };
    return postRequest(url, body, headers)
      .then(res => resolve(res.data.publicKey))
      .catch(reject);
  });

const processCreateAccount = req =>
  new Promise((resolve, reject) => {
    let userUuidVault, publicKey, chainId;
    return _registerUserToVault(req)
      .then(result => {
        userUuidVault = result.data.uuid;
        return _getPublicKey(req, userUuidVault);
      })
      .then(pubKey => {
        let tr = new TransactionBuilder();
        let registrarAccount = "nathan";
        let accountName = req.body.name;
        publicKey = pubKey;
        Apis.instance("ws://192.168.10.81:11011", true) // TODO: Replace URL
          .init_promise.then(res => {
            chainId = res[0].network.chain_id;
            return ChainStore.init();
          })
          .then(() => Promise.all([FetchChain("getAccount", registrarAccount)]))
          .then(res => {
            let [registrarAccount] = res;

            /* Account Create */
            tr.add_type_operation("account_create", {
              referrer_percent: 0,
              registrar: registrarAccount.get("id"),
              referrer: registrarAccount.get("id"),
              name: `hwd${accountName}`,
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
            return _getSignature(trBuff, registrarAccount);
          })
          .then(sign => {
            tr.signatures.push(sign);
            return tr.broadcast();
          })
          .then(res => {
            const connection = getConnection();
            const user = new User();
            user.name = accountName;
            user.vault_uuid = userUuidVault;
            user.bts_publickey = publicKey;
            connection.manager
              .save(user)
              .then(() => resolve(res[0].id))
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });

const _getUuid = async (registrarAccount) => {
  const connection = getConnection();
  const UserRepository = connection.getRepository(User);
  const registrar = await UserRepository.findOne({ name: registrarAccount });
  return registrar.vault_uuid;
}

const _getSignature = (trHex, registrarAccount) =>
  new Promise(async (resolve, reject) => {
    const url = `${vaultBaseUrl}/api/signature`;
    const txDigest = {
      transactionDigest: trHex
    };
    const registrarUuid = await _getUuid(registrarAccount);
    const body = {
      coinType: 240,
      path: "",
      payload: JSON.stringify(txDigest),
      uuid: registrarUuid
    };
    const headers = {
      "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s",
      "Content-Type": "application/json"
    };
    return postRequest(url, body, headers)
      .then(res => resolve(res.data.signature))
      .catch(reject);
  });

export default processCreateAccount;
