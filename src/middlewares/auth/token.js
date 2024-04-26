const jwt = require('jsonwebtoken');
require('dotenv').config();
const { responseMessages } = require('./../../constants/responseMessage');
const { responseCodes, httpCodes } = require('./../../constants/responseCodes');
const awsConfig = require('../../../config/aws');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']; 
  if (!token) {
    return res.status(responseCodes.code_4x3).send({
      statusCode : responseCodes.code_forbidden_access,
      message: responseMessages.token_required,
    });
  }
    
  jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {  
    if (err) {
      return res.status(responseCodes.code_4x1).send({
        statusCode : responseCodes.code_unauthorized,
        message: responseMessages.token_invalid,
      });
    }
    let hosturl = req.headers.tenant;  
    let domianName = awsConfig.aws.domain;
    let tenantName = hosturl.replace(domianName, '');
    let tenant = tenantName.trim();    
    req.body.loginUser_id = decoded.id;
    req.body.tenant_id = decoded.tenant_id;
    req.body.loginTenantName = tenant;
    req.body.createdBy = { id : decoded.id, type: 'User' };
    req.body.updatedBy = { id : decoded.id, type: 'User' };
    console.log(decoded);
    next();
  });
};