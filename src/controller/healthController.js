import Responder from '../lib/expressResponder';

export default class HealthController {
  static getStatus = (req, res) => Responder.success(res, 'Service is up');
}

