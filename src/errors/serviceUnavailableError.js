import BaseError from './baseError';

class ServiceUnavailableError extends BaseError {

  constructor(message) {
    super(message, 503);
  }

}

export default ServiceUnavailableError;