import BaseError from './baseError';

class BadRequestError extends BaseError {

  constructor(message) {
    super(message, 400);
  }

}

export default BadRequestError;
