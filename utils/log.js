const logger = require('./logger');
require('dotenv').config();

const logRequest = async (logType, request, message = null) => {
  const url = request.protocol + '://' + request.get('Host') + request.url;
  let requestLogMessage = '';
  requestLogMessage = url ? requestLogMessage + `request_url : ${url} | ` : requestLogMessage;
  const method = request.method;
  const methodType = method.toLowerCase();
  requestLogMessage = requestLogMessage + `Method : ${request.method} | `;
  if (methodType === 'post') {
    requestLogMessage = request.body.request_id ? requestLogMessage + `request_id : ${request.body.request_id} | ` : requestLogMessage;
  } else {
    requestLogMessage = request.body.request_id ? requestLogMessage + `request_id : ${request.query.request_id} | ` : requestLogMessage;
  }
  requestLogMessage = request.userName ? requestLogMessage + `user:${request.userName} | ` : requestLogMessage;
  requestLogMessage = request.body ? requestLogMessage + `data : ${JSON.stringify(request.body)} | ` : requestLogMessage;
  requestLogMessage = message ? requestLogMessage + `message : ${message} ` : requestLogMessage;
  const tenantName = request.body.login_subdomain_name ? request.body.login_subdomain_name : process.env.DEFAULT_LOG_LOCATION;
  logger(`${tenantName}`).log(`${logType}`, requestLogMessage);
};

const logResponse = async (logType, request, response, message = null) => {
  let responseLogMessage = '';
  responseLogMessage = request.body.request_id ? responseLogMessage + `request_id : ${request.body.request_id} | ` : responseLogMessage;
  responseLogMessage = response ? responseLogMessage + `response_data : ${JSON.stringify(response)} | ` : responseLogMessage;
  responseLogMessage = message ? responseLogMessage + `message : ${message} ` : responseLogMessage;
  const tenantName = request.body.login_subdomain_name ? request.body.login_subdomain_name : process.env.DEFAULT_LOG_LOCATION;
  logger(`${tenantName}`).log(`${logType}`, responseLogMessage);
};

module.exports = { logRequest, logResponse };
