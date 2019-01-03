import BaseError from './baseError';

class ComplianceError extends BaseError {

  constructor(message) {
    super(message, 503);
  }

}

export default ComplianceError;