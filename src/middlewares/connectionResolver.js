const createNamespace = require('cls-hooked').createNamespace;
const { getTenantConnection } = require('./connectionManager');
const { dbConnection } = require('../../config/database');
const { responseMessages } = require('../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../constants/responseCodes');
const nameSpace = createNamespace('codetruWorkforce');
const { logRequest } = require('../../utils/log');
const { aws } = require('../../config/aws');

/**
 * Establish the db connection for the connection
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const connectionRequest = async (req, res, next) => {
  let tenant_id = req.body.tenant_id || null;
  if (tenant_id == null) {
    return res
      .status(httpCodes.code403)
      .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameRequired });
  } else {
    let tenantAvailabe = await dbConnection.select().from('tenant').where('id', tenant_id).where('is_active', true).whereNull('deleted_at');
    if (tenantAvailabe.length == 0) {
      return res
        .status(httpCodes.code403)
        .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameNotExists });
    } else {
      let connectionInfo = await getTenantConnection(tenantAvailabe[0].id);
      req.body.subdomain_name = tenantAvailabe[0].subdomain_name;
      req.subdomain_name = tenantAvailabe[0].subdomain_name;
      nameSpace.run(() => {
        nameSpace.set('connection', connectionInfo);
        console.log('namespace connection set with token ' + req.protocol + '://' + req.get('Host') + req.url + req.body.logginUserName);
        next();
      });
    }
  }
};

/**
 * Based on the subdomain name establish the tenenat connection
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const subdomainRequestConnection = async (req, res, next) => {
  let subdomain_name = req.body.subdomain_name || null;

  if (subdomain_name == null) {
    return res
      .status(httpCodes.code403)
      .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameRequired });
  } else {
    let str = req.body.subdomain_name;
    let aws_subdomain = aws.domain;
    subdomain_name = str.replace('.' + aws_subdomain, '');
    req.subdomain_name = subdomain_name;
    req.body.subdomain_name = subdomain_name;

    let tenantAvailabe = await dbConnection.select().from('tenant').where('subdomain_name', subdomain_name).where('is_active', true).whereNull('deleted_at');
    if (tenantAvailabe.length == 0) {
      return res
        .status(httpCodes.code403)
        .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameNotExists });
    } else {
      let connectionInfo = await getTenantConnection(tenantAvailabe[0].id);
      req.tenant_id = tenantAvailabe[0].id; // appending the tenant id to the body
      nameSpace.run(() => {
        nameSpace.set('connection', connectionInfo);
        console.log('namespace connection set without token ' + req.protocol + '://' + req.get('Host') + req.url + req.body.logginUserName);
        next();
      });
    }
  }
};


const subdomainRequestConnectionEstablish = async (req, res, next) => {
  // let subdomain_name = req.query.subdomain_name || null;
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'GET') {
    let requestSegments = req.path.split('/');
    let slug = requestSegments[requestSegments.length - 2];
    console.log(slug, 'slug')
    req.body.subdomain_name = slug;
    var subdomain_name = req.body.subdomain_name || null;
  } else {
    var subdomain_name = req.query.subdomain_name || null;
  }

  if (subdomain_name == null) {
    return res
      .status(httpCodes.code403)
      .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameRequired });
  } else {
    let str = subdomain_name;
    let aws_subdomain = aws.domain;
    subdomain_name = str.replace('.' + aws_subdomain, '');
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body.subdomain_name = subdomain_name;
    } else {
      req.query.subdomain_name = subdomain_name;
    }

    let tenantAvailabe = await dbConnection.select().from('tenant').where('subdomain_name', subdomain_name).where('is_active', true).whereNull('deleted_at');
    if (tenantAvailabe.length == 0) {
      return res
        .status(httpCodes.code403)
        .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameNotExists });
    } else {
      req.query.tenant_id = tenantAvailabe[0].id;
      let connectionInfo = await getTenantConnection(tenantAvailabe[0].id);
      nameSpace.run(() => {
        nameSpace.set('connection', connectionInfo);
        console.log('namespace set' + req.protocol + '://' + req.get('Host') + req.url);
        next();
      });
    }
  }
};

module.exports = { connectionRequest, subdomainRequestConnection, subdomainRequestConnectionEstablish };
