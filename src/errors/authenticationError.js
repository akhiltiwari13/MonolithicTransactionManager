import BaseError from './baseError';

class AuthenticationError extends BaseError {

  constructor(message, apiKey) {
    super(message, 401);
    this.apiKey = apiKey;
  }

}

export default AuthenticationError;