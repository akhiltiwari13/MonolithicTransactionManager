import BaseError from './baseError';

class RateLimitError extends BaseError {

  constructor(message) {
    super(message, 429);
  }

}

export default RateLimitError;