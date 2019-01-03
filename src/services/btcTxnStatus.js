import { CronJob } from 'cron';
import logger from '../lib/logger';
import { getConnection } from "typeorm";
import { Transfer } from "../entity/transfer";
import async from 'async';
import envConfig from "../../config/envConfig";
import { getRequest } from "../lib/request";

const minConfirmations = 6;
const btcEnvironment = envConfig.get('env');
const btcBaseUrl = btcEnvironment === 'development' ? envConfig.get('btcTestBaseUrl') : envConfig.get('btcMainBaseUrl');

export const BTCTxnStatusServices = () => {

  logger.debug('BTC Txn Status Service ==> Initialized');

  const _updateTxnStatus = async (txnId) => {
    logger.debug('BTC Txn Status Service ==> Updating pending BTC txns status to confirmed');
    const connection = getConnection();
    const TransferRepository = connection.getRepository(Transfer);
    const txnToUpdate = await TransferRepository.findOne({ txn_id: txnId });
    txnToUpdate.txn_status = 'CONFIRMED';
    return connection.manager.save(txnToUpdate);
  }

  const _checkTxnStatus = pendingBTCTxns => {
    logger.debug('BTC Txn Status Service ==> Checking pending BTC txns status');
    return new Promise((resolve, reject) =>
      async.eachLimit(pendingBTCTxns, 10, txn => {
        const url = `${btcBaseUrl}/tx/${txn.txn_id}`;
        return getRequest(url)
          .then(txnSummary => {
            if (txnSummary.confirmations >= minConfirmations) {
              return _updateTxnStatus(txn.txn_id)
                .then(txn => logger.debug(`BTC Txn Status Service ==> Txn ${txn.txn_id} is confirmed`))
                .catch(reject)
            } else {
              logger.debug(`BTC Txn Status Service ==> Txn ${txn.txn_id} is pending`);
            }
          })
          .catch(reject)
      }, err => err ? reject(err) : resolve()));
  }

  const _pickPendingBTCTxns = async () => {
    logger.debug('BTC Txn Status Service ==> Picking pending BTC txns');
    const connection = getConnection();
    const TransferRepository = connection.getRepository(Transfer);
    const pendingBTCTxns = await TransferRepository.find({ coin_id: 'BTC', txn_status: 'PENDING' });
    return pendingBTCTxns;
  }

  const job = new CronJob('0 */5 * * * *', async () => {
    const pendingBTCTxns = await _pickPendingBTCTxns();
    if (pendingBTCTxns.length) {
      return _checkTxnStatus(pendingBTCTxns);
    }
    logger.debug('BTC Txn Status Service ==> No pending BTC txns');
  });

  job.start();
}
