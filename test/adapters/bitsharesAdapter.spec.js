import BitsharesAdapter from '../../src/adapters/bitsharesAdapter';
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

describe('BitsharesAdapter Adapter', () => {

  it('should raise an error for invalid BTS transaction id', async () => {
    try {
      await new BitsharesAdapter().getStatus('BTS', 'invalid_bts_txId');
    } catch (statusError) {
      chai.expect(statusError.status).to.equal(400);
      chai.expect(statusError.message).to.equal('Transaction does not exists');
    }
  });

  it('should return status as CONFIRMED for BTS', async () => {
    const status = await new BitsharesAdapter().getStatus('BTS', 'test_bts_confirmed');
    chai.expect(status).to.equal('CONFIRMED');
  });

  it('should raise an error in getBalance for invalid BTS account name', async () => {
    try {
      await new BitsharesAdapter().getBalance(config.headers, 'invalid_account_name');
    } catch (balanceError) {
      chai.expect(balanceError.status).to.equal(400);
      chai.expect(balanceError.message).to.equal('Account does not exists');
    }
  });

  it('should return balance for valid BTS account name', async () => {
    const balanceResponse = await new BitsharesAdapter().getBalance(config.headers, 'random01');
    chai.expect(balanceResponse.accountName).to.equal('random01');
    chai.expect(balanceResponse.balance).to.equal('4170');
    chai.expect(balanceResponse.unit).to.equal('BTS');
  });

  it('should raise an error in getTxnHistory for invalid BTS account name', async () => {
    try {
      await new BitsharesAdapter().getTransactionHistory(config.headers, 'invalid_account_name');
    } catch (txnHistoryError) {
      chai.expect(txnHistoryError.status).to.equal(400);
      chai.expect(txnHistoryError.message).to.equal('Account does not exists');
    }
  });

  //TODO: positive test case for getTxnHistory

  it('should raise an error in account creation if name is missing', async () => {
    try {
      const noNameRequest = _.omit(config.btsAccountCreation, ["body.name"]);
      await new BitsharesAdapter().createAccount(noNameRequest);
    } catch (accountCreationError) {
      config.btsAccountCreation.body.name = 'unit_test_name';
      chai.expect(accountCreationError.status).to.equal(400);
      chai.expect(accountCreationError.message).to.equal('Account name is required');
    }
  });

  it('should raise an error in account creation if invalid account name format', async () => {
    try {
      await new BitsharesAdapter().createAccount(config.btsAccountCreation);
    } catch (accountCreationError) {
      chai.expect(accountCreationError.status).to.equal(400);
      chai.expect(accountCreationError.message).to.equal('Error in account creation');
    }
  });

  it('should raise an error in account creation if account name contains upper case', async () => {
    try {
      config.btsAccountCreation.body.name = 'testName'
      await new BitsharesAdapter().createAccount(config.btsAccountCreation);
    } catch (accountCreationError) {
      chai.expect(accountCreationError.status).to.equal(400);
      chai.expect(accountCreationError.message).to.equal('Account name must not contain upper case character');
    }
  });

  // it('should return response if account create successfully', async () => {
  //   config.btsAccountCreation.body.name = 'testname'
  //   const accountResponse = await new BitsharesAdapter().createAccount(config.btsAccountCreation);
  //   chai.expect(accountResponse.name).to.equal('testname');
  // });

  it('should raise an error in transfer of BTS if fromAccount is missing', async () => {
    try {
      const noSenderRequest = _.omit(config.btsReq, ["body.fromAccount"]);
      await new BitsharesAdapter().transfer(noSenderRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('fromAccount is mandatory');
    }
  });

  it('should raise an error in transfer of BTS if toAccount is missing', async () => {
    try {
      const noReceiverRequest = _.omit(config.btsReq, ["body.toAccount"]);
      await new BitsharesAdapter().transfer(noReceiverRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('toAccount is mandatory');
    }
  });

  it('should raise an error in transfer of BTS if sendAmount is missing', async () => {
    try {
      const noSendAmountRequest = _.omit(config.btsReq, ["body.sendAmount"]);
      await new BitsharesAdapter().transfer(noSendAmountRequest);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('sendAmount is mandatory');
    }
  });

  it('should raise an error in transfer of BTS if invalid sender account name', async () => {
    try {
      config.btsReq.body.fromAccount = "invalid_account_name";
      await new BitsharesAdapter().transfer(config.btsReq);
    } catch (transferError) {
      config.btsReq.body.fromAccount = "random01";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('sender account does not exists');
    }
  });

  it('should raise an error in transfer of BTS if invalid receiver account name', async () => {
    try {
      config.btsReq.body.toAccount = "invalid_account_name";
      await new BitsharesAdapter().transfer(config.btsReq);
    } catch (transferError) {
      config.btsReq.body.toAccount = "random02";
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('receiver account does not exists');
    }
  });

  // it('should return TranscationId for successful BTS transaction', async () => {
  //   const txnIdResponse = await new BitsharesAdapter().transfer(config.btsReq);
  //   chai.expect(txnIdResponse.TranscationId).to.equal('c7aa99ef3d8e1e87fded119d055ba196bbc36389');
  // });

  it('should raise an error in getPrice of BTS if invalid currency', async () => {
    try {
      config.btsQuery.currency = 'invalid_currency';
      await new BitsharesAdapter().getPrice('BTS', config.btsQuery);
    } catch (transferError) {
      config.btsQuery.currency = 'INR';
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Invalid Currency');
    }
  });

  it('should raise an error in getPrice of BTS if invalid coin', async () => {
    try {
      await new BitsharesAdapter().getPrice('invalid_coin', config.btsQuery);
    } catch (transferError) {
      chai.expect(transferError.status).to.equal(400);
      chai.expect(transferError.message).to.equal('Coin and Blockchain mismatched');
    }
  });

  it('should return price for BTS in desired currency', async () => {
    config.btsQuery.currency = "INR";
    const priceResponse = await new BitsharesAdapter().getPrice('BTS', config.btsQuery);
    chai.expect(priceResponse.coin).to.equal('BTS');
    chai.expect(priceResponse[config.btsQuery.currency]).to.equal(8.02);
  });

})
