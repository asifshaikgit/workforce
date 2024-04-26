const { responseCodes } = require('../constants/responseCodes');

class UnauthorizedError extends Error {
  constructor(message = null, statusCode = null) {
    super(message);
    this.message = message;
    this.statusCode = responseCodes.codeUnprocessableEntity;
  }
}
  
module.exports = UnauthorizedError;