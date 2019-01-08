import { CronJob } from 'cron';
import logger from '../lib/logger';
import { getConnection } from "typeorm";
import { Transfer } from "../entity/transfer";
import async from 'async';
import Web3 from 'web3'; // to get web3 to work.
import envConfig from "../../config/envConfig";

const ethereumNodeURL = envConfig.get("ethBaseUrl")

if (typeof web3 !== 'undefined') {
  var web3 = new Web3(web3.currentProvider);
} else {
  var web3 = new Web3(new Web3.providers.HttpProvider(ethereumNodeURL));
}

export const ETHTxnStatusServices = () => {
  logger.debug('ETH Txn Status Service ==> Initialized');

  const _updateTxnStatus = async (txnId, status) => {
    logger.debug('ETH Txn Status Service ==> Updating pending ETH txns status');
    const connection = getConnection();
    const TransferRepository = connection.getRepository(Transfer);
    const txnToUpdate = await TransferRepository.findOne({ txn_id: txnId });
    txnToUpdate.txn_status = status;
    return connection.manager.save(txnToUpdate);
  }

  const _checkTxnStatus = pendingETHTxns => {
    logger.debug('ETH Txn Status Service ==> Checking pending ETH txns status');
    return new Promise((resolve, reject) =>
      async.eachLimit(pendingETHTxns, 10, async (txn) => {
        const receipt = await web3.eth.getTransactionReceipt(txn.txn_id);
        if (receipt.status === '0x1') {
          return _updateTxnStatus(txn.txn_id, 'CONFIRMED')
            .then(txn => logger.debug(`ETH Txn Status Service ==> Txn ${txn.txn_id} is confirmed`))
            .catch(reject)
        }
        if (receipt.status === '0x0') {
          return _updateTxnStatus(txn.txn_id, 'FAILED')
            .then(txn => logger.debug(`ETH Txn Status Service ==> Txn ${txn.txn_id} is failed`))
            .catch(reject)
        } else {
          logger.debug(`ETH Txn Status Service ==> Txn ${txn.txn_id} is pending`);
        }
      }, err => err ? reject(err) : resolve()));
  }

  const _pickPendingETHTxns = async () => {
    logger.debug('ETH Txn Status Service ==> Picking pending ETH txns');
    const connection = getConnection();
    const TransferRepository = connection.getRepository(Transfer);
    const pendingETHTxns = await TransferRepository.find({ coin_id: 'ETH', txn_status: 'PENDING' });
    return pendingETHTxns;
  }

  const job = new CronJob('0 */2 * * * *', async () => {
    const pendingETHTxns = await _pickPendingETHTxns();
    if (pendingETHTxns.length) {
      return _checkTxnStatus(pendingETHTxns);
    }
    logger.debug('ETH Txn Status Service ==> No pending ETH txns');
  });

  job.start();
}
