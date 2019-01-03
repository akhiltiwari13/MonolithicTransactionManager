import BaseError from './baseError';

class ParameterInvalidError extends BaseError {

  constructor(message) {
    super(message, 404);
  }

}

export default ParameterInvalidError;