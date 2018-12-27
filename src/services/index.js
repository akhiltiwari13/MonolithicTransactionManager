import { BTCTxnStatusServices } from './btcTxnStatus';
import { ETHTxnStatusServices } from './ethTxnStatus';

export default function initServices() {
  var services = [{
    name: 'BTC Txn Status',
    run: true,
    initializer: BTCTxnStatusServices()
  }, {
    name: 'ETH Txn Status',
    run: true,
    initializer: ETHTxnStatusServices()
  }];
  for (var i in services) {
    if (services[i].run) {
      services[i].initializer;
    }
  }
}
