import Responder from '../lib/expressResponder';

export default class HealthController {
  static getStatus(req, res) {
    return Responder.success(res, 'Service is up');
  }
}
