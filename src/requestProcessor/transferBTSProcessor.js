import { postRequest } from "../lib/request";
import { Apis } from "bitsharesjs-ws";
import { ChainStore, FetchChain, TransactionBuilder } from "bitsharesjs";
import envConfig from "../../config/envConfig";
import { getConnection } from "typeorm";
import { Transfer } from "../entity/transfer";
import { User } from "../entity/user";

const vaultBaseUrl = envConfig.get("vaultBaseUrl");

const processTransfer = req =>
  new Promise((resolve, reject) => {
    let chainId;
    const fromAccount = req.body.fromAccount;
    const toAccount = req.body.toAccount;
    const amount = req.body.sendAmount * 100000;
    const sendAmount = {
      amount,
      asset: "BTS"
    };
    let tr = new TransactionBuilder();
    Apis.instance("ws://192.168.10.81:11011", true)
      .init_promise.then(res => {
        chainId = res[0].network.chain_id;
        return ChainStore.init();
      })
      .then(() =>
        Promise.all([
          FetchChain("getAccount", `hwd${fromAccount}`),
          FetchChain("getAccount", `hwd${toAccount}`),
          FetchChain("getAsset", sendAmount.asset),
          FetchChain("getAsset", sendAmount.asset)
        ])
      )
      .then(res => {
        let [fromAccount, toAccount, sendAsset, feeAsset] = res;

        tr.add_type_operation("transfer", {
          fee: {
            amount: 0,
            asset_id: feeAsset.get("id")
          },
          from: fromAccount.get("id"),
          to: toAccount.get("id"),
          amount: {
            amount: sendAmount.amount,
            asset_id: sendAsset.get("id")
          }
        });

        return tr.set_required_fees();
      })
      .then(() => tr.finalize())
      .then(() => {
        const tr_buff = Buffer.concat([
          new Buffer(chainId, "hex"),
          tr.tr_buffer
        ]);
        const trBuff = tr_buff.toString("hex");
        return _getSignature(trBuff, req.body.fromAccount);
      })
      .then(sign => {
        tr.signatures.push(sign);
        return tr.broadcast();
      })
      .then(res => {
        const connection = getConnection();
        const transfer = new Transfer();
        transfer.tx_id = res[0].id;
        transfer.from = fromAccount;
        transfer.to = toAccount;
        transfer.amount = amount;
        connection.manager
          .save(transfer)
          .then(() => resolve(res[0].id))
          .catch(reject);
      })
      .catch(reject);
  });

const _getUuid = async (userName) => {
  const connection = getConnection();
  const UserRepository = connection.getRepository(User);
  const senderUuid = await UserRepository.findOne({ name: userName });
  return senderUuid.vault_uuid;
}

const _getSignature = (trHex, senderName) =>
  new Promise(async (resolve, reject) => {
    const txDigest = {
      transactionDigest: trHex
    };
    const senderUuid = await _getUuid(senderName);
    const body = {
      coinType: 240,
      path: "",
      payload: JSON.stringify(txDigest),
      uuid: senderUuid
    };
    const url = `${vaultBaseUrl}/api/signature`;
    const headers = { "x-vault-token": "5oPMP8ATL719MCtwZ1xN0r5s" };
    return postRequest(url, body, headers)
      .then(res => resolve(res.data.signature))
      .catch(reject);
  });

export default processTransfer;
