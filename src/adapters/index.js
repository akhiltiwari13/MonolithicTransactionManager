import BitcoinAdapter from './bitcoinAdapter';
import BitsharesAdapter from './bitsharesAdapter';
import EthereumAdapter from './ethereumAdapter';
import CommonAdapter from './commonAdapter';
import { BadRequestError } from '../errors';

export const getBlockchain = (blockchain) => {
  switch (blockchain) {
    case 'BTC':
      return new BitcoinAdapter();
    case 'ETH':
      return new EthereumAdapter();
    case 'BTS':
      return new BitsharesAdapter();
    case 'ALL':
      return new CommonAdapter();
    default:
      throw new BadRequestError('Unknown Blockchain Passed');
  }
}

export { BitsharesAdapter, EthereumAdapter, BitcoinAdapter };
