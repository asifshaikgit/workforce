const InvalidRequestError = require('../error/InvalidRequestError');
const UnExpectedError = require('../error/UnExpectedError');
const SubDomainCreationError = require('../error/SubDomainCreationError');
const { httpCodes } = require('../constants/responseCodes');
const { logResponse } = require('../utils/log');

const errorHandler = (error, req, res, next) => {
  if (error instanceof InvalidRequestError) {
    const responseData = {
      message: error.message,
      statusCode: error.statusCode,
    };

    /* Log Response */
    logResponse('error', req, responseData);
    /* Log Response */

    return res.status(httpCodes.code422).json(responseData);
  }

  if (error instanceof UnExpectedError) {
    const responseData = {
      message: error.message,
      statusCode: error.statusCode,
    };

    /* Log Response */
    logResponse('error', req, responseData);
    /* Log Response */

    return res.status(httpCodes.code500).json(responseData);
  }

  if (error instanceof SubDomainCreationError) {
    const responseData = {
      message: error.message,
      statusCode: error.statusCode,
    };

    /* Log Response */
    logResponse('error', req, responseData);
    /* Log Response */

    return res.status(httpCodes.code500).json(responseData);
  }

  const responseData = {
    message: 'Some Thing went Wrong',
    error: error.stack,
    statusCode: error.statusCode,
  };

  /* Log Response */
  logResponse('error', req, responseData);
  /* Log Response */

  return res.status(500).send(responseData);
};

module.exports = errorHandler;
