const { responseCodes } = require('../constants/responseCodes');

class SubDomainCreationError extends Error {
  constructor(message , statusCode) {
    super(message);
    this.message = message;
    this.statusCode = responseCodes.codeUnprocessableEntity;
  }
}
  
module.exports = SubDomainCreationError;