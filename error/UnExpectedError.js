const { responseCodes } = require('../constants/responseCodes');

class UnExpectedError extends Error {
  constructor(message = null, statusCode = null) {
    super(message);
    this.message = message;
    this.statusCode = responseCodes.codeUnprocessableEntity;
  }
}
  
module.exports = UnExpectedError;