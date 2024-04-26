const { responseCodes } = require('../constants/responseCodes');

class InvalidRequestError extends Error {
  constructor(message = null, statusCode = null) {
    super(message);
    this.message = message;
    this.statusCode = responseCodes.codeUnprocessableEntity;
  }
}
  
module.exports = InvalidRequestError;