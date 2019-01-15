import EthereumAdapter from '../../src/adapters/ethereumAdapter';
import chai from 'chai';
import logger from '../../src/lib/logger';
import connectTestDB from '../mocks/mockTypeorm';
import { seedDatabase, dropDatabase } from '../mocks/mockDatabase';
import config from '../config.json';
import _ from 'lodash';
import { getConnection } from "typeorm";

before(async () => {
  try {
    const connection = getConnection();
    if (!connection) {
      await connectTestDB();
      await dropDatabase();
      await seedDatabase();
    }
  } catch (err) {
    logger.error("<===== Error while connecting test DB =====>");
    logger.error(err);
    logger.error("<===== Exiting the test DB process =====>");
    process.exit(1);
  }
});

describe('Ethereum Adapter', () => {

  it('should raise an error for invalid ETH transaction id', async () => {
    try {
      await new EthereumAdapter().getStatus('ETH', 'invalid_eth_txId');
    } catch (statusError) {
      chai.expect(statusError.status).to.equal(400);
      chai.expect(statusError.message).to.equal('Transaction does not exists');
    }
  });

  it('should return status as PENDING for ETH', async () => {
    const status = await new EthereumAdapter().getStatus('ETH', 'test_eth_pending');
    chai.expect(status).to.equal('PENDING');
  });

  it('should return status as CONFIRMED for ETH', async () => {
    const status = await new EthereumAdapter().getStatus('ETH', 'test_eth_confirmed');
    chai.expect(status).to.equal('CONFIRMED');
  });

  it('should raise an error in getBalance for invalid ETH account name', async () => {
    try {
      await new EthereumAdapter().getBalance(config.headers, 'invalid_account_name');
    } catch (balanceError) {
      chai.expect(balanceError.status).to.equal(400);
      chai.expect(balanceError.message).to.equal('Account does not exists');
    }
  });

  it('should return balance for valid ETH account name', async () => {
    const balanceResponse = await new EthereumAdapter().getBalance(config.headers, 'random01');
    chai.expect(balanceResponse.accountName).to.equal('random01');
    chai.expect(balanceResponse.balance).to.equal('1.9498425');
    chai.expect(balanceResponse.unit).to.equal('ETH');
  });

  it('should raise an error in getTxnHistory for invalid ETH account name', async () => {
    try {
      await new EthereumAdapter().getTransactionHistory(config.headers, 'invalid_account_name');
    } catch (txnHistoryError) {
      chai.expect(txnHistoryError.status).to.equal(400);
      chai.expect(txnHistoryError.message).to.equal('Account does not exists');
    }
  });

  //TODO: positive test case for getTxnHistory

  it('should raise an error in transfer of ETH if fromAccount is missing', async () => {
    try {
      const noSenderRequest = _.omit(config.ethReq, ["body.fromAccount"]);
      await new EthereumAdapter().transfer(noSenderRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('fromAccount is mandatory');
    }
  });

  it('should raise an error in transfer of ETH if toAccount is missing', async () => {
    try {
      const noReceiverRequest = _.omit(config.ethReq, ["body.toAccount"]);
      await new EthereumAdapter().transfer(noReceiverRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('toAccount is mandatory');
    }
  });

  it('should raise an error in transfer of ETH if sendAmount is missing', async () => {
    try {
      const noSendAmountRequest = _.omit(config.ethReq, ["body.sendAmount"]);
      await new EthereumAdapter().transfer(noSendAmountRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('sendAmount is mandatory');
    }
  });

  it('should raise an error in transfer of ETH if invalid sender account name', async () => {
    try {
      config.ethReq.body.fromAccount = "invalid_account_name";
      await new EthereumAdapter().transfer(config.ethReq);
    } catch (transferError) {
      config.ethReq.body.fromAccount = "random01";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('sender account does not exists');
    }
  });

  it('should raise an error in transfer of ETH if invalid receiver account name', async () => {
    try {
      config.ethReq.body.toAccount = "invalid_account_name";
      await new EthereumAdapter().transfer(config.ethReq);
    } catch (transferError) {
      config.ethReq.body.toAccount = "random02";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('receiver account does not exists');
    }
  });

  // it('should return TranscationId for successful ETH transaction', async () => {
  //   const txnIdResponse = await new EthereumAdapter().transfer(config.ethReq);
  //   chai.expect(txnIdResponse.TranscationId).to.equal('0x335986e239540c4dffe6a209dd40e7ff342742e0ba316a16de855a6c45de2ec7');
  // });

  it('should raise an error in getPrice of ETH if invalid currency', async () => {
    try {
      config.ethQuery.currency = 'invalid_currency';
      await new EthereumAdapter().getPrice('ETH', config.ethQuery);
    } catch (transferError) {
      config.ethQuery.currency = 'INR';
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Invalid Currency');
    }
  });

  it('should raise an error in getPrice of ETH if invalid coin', async () => {
    try {
      await new EthereumAdapter().getPrice('invalid_coin', config.ethQuery);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Coin and Blockchain mismatched');
    }
  });

  it('should return price for ETH in desired currency', async () => {
    config.ethQuery.currency = "INR";
    const priceResponse = await new EthereumAdapter().getPrice('ETH', config.ethQuery);
    chai.expect(priceResponse.coin).to.equal('ETH');
    chai.expect(priceResponse[config.ethQuery.currency]).to.equal(8382.9);
  });

})
