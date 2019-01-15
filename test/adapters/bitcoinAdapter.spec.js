import BitcoinAdapter from '../../src/adapters/bitcoinAdapter';
import chai from 'chai';
import logger from '../../src/lib/logger';
import connectTestDB from '../mocks/mockTypeorm';
import { seedDatabase, dropDatabase } from '../mocks/mockDatabase';
import config from '../config.json';
import _ from 'lodash';

before(async () => {
  try {
    await connectTestDB();
    await dropDatabase();
    await seedDatabase();
  } catch (err) {
    logger.error("<===== Error while connecting test DB =====>");
    logger.error(err);
    logger.error("<===== Exiting the test DB process =====>");
    process.exit(1);
  }
});

describe('Bitcoin Adapter', () => {

  it('should raise an error for invalid BTC transaction id', async () => {
    try {
      await new BitcoinAdapter().getStatus('BTC', 'invalid_btc_txId');
    } catch (statusError) {
      chai.expect(statusError.status).to.equal(400);
      chai.expect(statusError.message).to.equal('Transaction does not exists');
    }
  });

  it('should return status as PENDING for BTC', async () => {
    const status = await new BitcoinAdapter().getStatus('BTC', 'test_btc_pending');
    chai.expect(status).to.equal('PENDING');
  });

  it('should return status as CONFIRMED for BTC', async () => {
    const status = await new BitcoinAdapter().getStatus('BTC', 'test_btc_confirmed');
    chai.expect(status).to.equal('CONFIRMED');
  });

  it('should raise an error in getBalance for invalid BTC account name', async () => {
    try {
      await new BitcoinAdapter().getBalance(config.headers, 'invalid_account_name');
    } catch (balanceError) {
      chai.expect(balanceError.status).to.equal(400);
      chai.expect(balanceError.message).to.equal('Account does not exists');
    }
  });

  it('should return balance for valid BTC account name', async () => {
    const balanceResponse = await new BitcoinAdapter().getBalance(config.headers, 'random01');
    chai.expect(balanceResponse.accountName).to.equal('random01');
    chai.expect(balanceResponse.balance).to.equal('0.15111702');
    chai.expect(balanceResponse.unit).to.equal('BTC');
  });

  it('should raise an error in getTxnHistory for invalid BTC account name', async () => {
    try {
      await new BitcoinAdapter().getTransactionHistory(config.headers, 'invalid_account_name');
    } catch (txnHistoryError) {
      chai.expect(txnHistoryError.status).to.equal(400);
      chai.expect(txnHistoryError.message).to.equal('Account does not exists');
    }
  });

  //TODO: positive test case for getTxnHistory

  it('should raise an error in transfer of BTC if fromAccount is missing', async () => {
    try {
      const noSenderRequest = _.omit(config.btcReq, ["body.fromAccount"]);
      await new BitcoinAdapter().transfer(noSenderRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('fromAccount is mandatory');
    }
  });

  it('should raise an error in transfer of BTC if toAccount is missing', async () => {
    try {
      const noReceiverRequest = _.omit(config.btcReq, ["body.toAccount"]);
      await new BitcoinAdapter().transfer(noReceiverRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('toAccount is mandatory');
    }
  });

  it('should raise an error in transfer of BTC if sendAmount is missing', async () => {
    try {
      const noSendAmountRequest = _.omit(config.btcReq, ["body.sendAmount"]);
      await new BitcoinAdapter().transfer(noSendAmountRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('sendAmount is mandatory');
    }
  });

  it('should raise an error in transfer of BTC if invalid sender account name', async () => {
    try {
      config.btcReq.body.fromAccount = "invalid_account_name";
      await new BitcoinAdapter().transfer(config.btcReq);
    } catch (transferError) {
      config.btcReq.body.fromAccount = "random01";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Account does not exists');
    }
  });

  it('should raise an error in transfer of BTC if invalid receiver account name', async () => {
    try {
      config.btcReq.body.toAccount = "invalid_account_name";
      await new BitcoinAdapter().transfer(config.btcReq);
    } catch (transferError) {
      config.btcReq.body.toAccount = "random02";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Account does not exists');
    }
  });

  it('should return TranscationId for successful BTC transaction', async () => {
    const txnIdResponse = await new BitcoinAdapter().transfer(config.btcReq);
    chai.expect(txnIdResponse.TranscationId).to.equal('eabde297520e15c343a949ea92def8e049fc7d984c9b5fba3cfb8f94d41f5b67');
  });

  it('should raise an error in getPrice of BTC if invalid currency', async () => {
    try {
      config.btcQuery.currency = 'invalid_currency';
      await new BitcoinAdapter().getPrice('BTC', config.btcQuery);
    } catch (transferError) {
      config.btcQuery.currency = 'INR';
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Invalid Currency');
    }
  });

  it('should raise an error in getPrice of BTC if invalid coin', async () => {
    try {
      await new BitcoinAdapter().getPrice('invalid_coin', config.btcQuery);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Coin and Blockchain mismatched');
    }
  });

  it('should return price for BTC in desired currency', async () => {
    config.btcQuery.currency = "INR";
    const priceResponse = await new BitcoinAdapter().getPrice('BTC', config.btcQuery);
    chai.expect(priceResponse.coin).to.equal('BTC');
    chai.expect(priceResponse[config.btcQuery.currency]).to.equal(297342.74);
  });

})
