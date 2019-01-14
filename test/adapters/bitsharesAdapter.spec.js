import BitcoinAdapater from '../../src/adapters/bitcoinAdapter';
const should = require('chai').should();
const expect = require('chai').expect;

describe('Bitcoin Adapter', () => {
  it('should raise an error for invalid transaction id', () => {
    const txnStatus = BitcoinAdapater.getStatus('BTC', 'txnId');
    
  })
})
