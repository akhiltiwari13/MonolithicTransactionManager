import BaseError from './baseError';

class ExistsError extends BaseError {

  constructor(message) {
    super(message, 409);
  }

}

export default ExistsError;
