import BaseError from './baseError';

class ForbiddenError extends BaseError {

  constructor(message) {
    super(message, 403);
  }

}

export default ForbiddenError;