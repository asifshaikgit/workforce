require('dotenv').config();
const { getConnection } = require('./middlewares/connectionManager');
const { logRequest, logResponse } = require('../utils/log');
const { dbConnection } = require('../config/database');
const knex = require('knex');


/**
 * Response handler function for sending responses based on the environment.
 * 
 * Logic:
 * - Get the current environment from the NODE_ENV environment variable.
 * - Determine the HTTP status code to use for the response. Use the provided `httpStatus` in `responseData` if available; otherwise, use the default status 200.
 * - If the environment is 'development':
 *   + Send the complete `responseData` object as the response with the determined HTTP status code.
 * - Else(environment is not 'development):
 *   + Create a simplified `response` object with the `statusCode` and `message` from the `responseData`.
 *   + Send the simplified `response` object as the response with the determined HTTP status code.
 *    
 * @param {Object} res - The HTTP response object for sending the response.
 * @param {Object} responseData - The data to include in the response.
 */
const responseHandler = async (res, responseData) => {
  var req = {body:{request_id:''}};
  /* Release the db connection before retrun the response */
  logResponse('info', req, responseData, 'Response Handler connection checking');
  const db = await getConnection();
  logResponse('info', req, responseData, 'Response Handler get DB connection');
  let abb = await db.client.acquireConnection();
  logResponse('info', req, responseData, 'Response Handler getting assigned connection');
  await db.client.releaseConnection(abb);
  logResponse('info', req, responseData, 'Response Handler releasing acquired connection');
  /* Release the db connection before retrun the response */

  let environment = process.env.NODE_ENV;
  let httpStatusCode = (responseData.httpStatus ? responseData.httpStatus : 200);
  logResponse('info', req, responseData, 'Response Handler status' + httpStatusCode);

  res.status(httpStatusCode).send(responseData);

  // if (environment == 'development') {
  //   res.status(httpStatusCode).send(responseData);
  // } else {
  //   let response = { statusCode: responseData.statusCode, message: responseData.message };
  //   res.status(httpStatusCode).send(response);
  // }
};

/**
 * Tenant response handler function for sending responses based on the environment.
 * 
 * Logic:
 * - Get the current environment from the NODE_ENV environment variable.
 * - Determine the HTTP status code to use for the response. Use the provided `httpStatus` in `responseData` if available; otherwise, use the default status 200.
 * - If the environment is 'development':
 *   + Send the complete `responseData` object as the response with the determined HTTP status code.
 * - Else(environment is not 'development):
 *   + Create a simplified `response` object with the `statusCode` and `message` from the `responseData`.
 *   + Send the simplified `response` object as the response with the determined HTTP status code.
 *    
 * @param {Object} res - The HTTP response object for sending the response.
 * @param {Object} responseData - The data to include in the response.
 */
const tenantResponseHandler = async (res, responseData) => {
  
  /* Release the db connection before retrun the response */
  let abb = await dbConnection.client.acquireConnection();
  await dbConnection.client.releaseConnection(abb);
  /* Release the db connection before retrun the response */

  let environment = process.env.NODE_ENV;
  let httpStatusCode = (responseData.httpStatus ? responseData.httpStatus : 200);

  res.status(httpStatusCode).send(responseData);

  // if (environment == 'development') {
  //   res.status(httpStatusCode).send(responseData);
  // } else {
  //   let response = { statusCode: responseData.statusCode, message: responseData.message };
  //   res.status(httpStatusCode).send(response);
  // }
};

module.exports = { responseHandler, tenantResponseHandler };