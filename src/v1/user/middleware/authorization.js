const jwt = require('jsonwebtoken');
require('dotenv').config();
const { responseMessages } = require('../../../../constants/responseMessage');
const { responseCodes, httpCodes } = require('../../../../constants/responseCodes');
const indexRepository = require('../repositories/index');
const { getTenantConnection } = require('../../../middlewares/connectionManager');

/**
 * Middleware for verifying user authentication token.
 * 
 * Overview:
 *   - Checks if a valid authorization token is present in the request headers.
 *   - Verifies the token using the specified secret key.
 *   - If verification is successful:
 *     + Adds decoded information from the token to the request object, such as tenant ID, role ID, subdomain name, user name, user ID, super admin status, and more.
 *     + Sets `req.user` to the user's ID for future middleware and route handling.
 *   - Else(verification fails)
 *     + returns an appropriate HTTP response with the corresponding status code and error message.
 * 
 * Logic:
 *   - Check if a token is included in the request's 'Authorization' header.
 *   - If a token is found:
 *     + Use JWT to verify the token using the provided secret key.
 *     + If verification is successful:
 *       ~ Add the decoded information from the token to the request object for further processing.
 *       ~ Set `req.user` to the user's ID.
 *     + Else(verification fails):
 *       ~ Return a 401 Unauthorized response with an error message indicating that the token is invalid.
 *   - Else(no token is found):
 *     + Return a 403 Forbidden Access response with an error message indicating that a token is required.
 * 
 * @param {Object} req - The request object containing the authentication token in the headers.
 * @param {Object} res - The response object for sending HTTP responses.
 * @param {function} next - The next middleware or route handler to invoke if authentication is successful.
 * @returns {Object} - An HTTP response or proceeds to the next middleware based on the authentication result.
 */
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    if (req.headers.tenant_id && req.headers.tenant_id != '') {
      req.body.tenant_id = req.headers.tenant_id;
      next();
    } else {
      return res.status(httpCodes.code403).send({
        statusCode: responseCodes.codeForbiddenAccess,
        message: responseMessages.login.tokenRequired,
      });
    }
  } else {
    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(httpCodes.code401).send({
          statusCode: responseCodes.codeUnauthorized,
          message: responseMessages.login.tokenInvalid,
        });
      }
      req.body.tenant_id = decoded.tenant_id;
      req.tenant_id = decoded.tenant_id;
      req.body.loginRoleId = decoded.role_id ? decoded.role_id : 1;
      req.body.loginSubDomainName = decoded.subdomain_name;
      req.body.login_subdomain_name = decoded.subdomain_name;
      req.body.logginUserName = decoded.userName;
      req.body.loginUserId = decoded.id;
      req.body.loginUserAdmin = decoded.is_super_admin;
      req.body.logginTenantOwner = false;
      req.body.created_by = decoded.id;
      req.body.updated_by = decoded.id;
      req.user = decoded.id;
      next();
    });
  }
};

/**
 * Middleware for checking permissions access.
 * 
 * Overview:
 *   - This middleware checks if the user has the required permissions to access a particular resource or perform an action.
 *   - It validates the user's role, super admin status, and permissions based on the provided permission name and additional permission.
 *   - It allows or denies access based on the user's role and permissions.
 *   - If access is denied, it returns an appropriate HTTP response with the corresponding status code and error message.
 * 
 * Logic:
 *   - Check if a valid authorization token is present in the request headers.
 *   - Get the user's role, super admin status, and employment type from the 'employee' table.
 *   - Determine if the user is a tenant owner and if they have a specific role or super admin status.
 *   - Check the user's access rights based on the provided permission name and additional permission from 'role_permissions' table.
 *     + If permission name is 'not_applicable' or the user is a super admin, access is granted.
 *     + If permission name is provided and the user's role allows it, access is granted.
 *     + If an additional permission is provided and the user's role allows it, access is granted.
 *     + Otherwise, access is denied with an unauthorized access error message.
 * 
 * @param {string} permissionName - The name of the permission to check.
 * @param {string} additionalPermission - An additional permission to check.
 * @param {Object} req - The request object containing user authentication and role information.
 * @param {Object} res - The response object for sending HTTP responses.
 * @param {function} next - The next middleware or route handler to invoke if access is granted.
 * @returns {Object} - An HTTP response or proceeds to the next middleware based on the permission check result.
 */
exports.permissionsAccessCheck = (permissionName, additionalPermission = null, segmentBasedPermissions = null) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    const filters = { access_token: token, id: req.body.loginUserId };
    const fields = ['is_tenant_owner', 'employment_type_id', 'role_id', 'is_super_admin', 'contact_number'];
    const acccessTokenValid = await indexRepository.find('employee', fields, filters);
    if (acccessTokenValid.status) {
      req.body.logginTenantOwner = acccessTokenValid.data[0].is_tenant_owner;
      req.body.loggedInContactInfo = acccessTokenValid.data[0].contact_number;
      if (acccessTokenValid.data[0].employment_type_id === 1) {
        const roleId = acccessTokenValid.data[0].role_id;
        let permissionCondition;
        if (permissionName === 'not_applicable' || acccessTokenValid.data[0].is_super_admin === true) { 
          next();
        } else if ((permissionName === 'configurations_create' || permissionName === 'configurations_edit' || permissionName === 'configurations_view' || permissionName === 'configurations_delete') && additionalPermission === 'configuration_') {
          permissionCondition =  additionalPermission + req.path.split('/')[2].replace(/-/g, '_');

          const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': permissionCondition, 'role_permissions.is_allowed': true, 'roles.is_active': true };
            const joins = [
              { table: 'permissions', condition: ['permissions.id', 'role_permissions.permission_id'], type: 'inner' },
              { table: 'roles', condition: ['roles.id', 'role_permissions.role_id'], type: 'inner' },
            ];
            const rolePermission = await indexRepository.find('role_permissions', ['role_permissions.id','roles.name'], filters, 25, joins);
            if (rolePermission.status) {
              req.body.loginRoleName = rolePermission.data[0].name;
              next();
            } else {
              res
                .status(httpCodes.code200)
                .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.unAuthorisedAccess });
            }

        } else {
          if (segmentBasedPermissions) {
            permissionCondition = req.path.split('/')[2].replace("-", "_") + permissionName;
          } else {
            permissionCondition = permissionName;
          }

          if (additionalPermission === null ) {
            const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': permissionCondition, 'role_permissions.is_allowed': true, 'roles.is_active': true };
            const joins = [
              { table: 'permissions', condition: ['permissions.id', 'role_permissions.permission_id'], type: 'inner' },
              { table: 'roles', condition: ['roles.id', 'role_permissions.role_id'], type: 'inner' },
            ];
            const rolePermission = await indexRepository.find('role_permissions', ['role_permissions.id','roles.name'], filters, 25, joins);
            if (rolePermission.status) {
              req.body.loginRoleName = rolePermission.data[0].name;
              next();
            } else {
              res
                .status(httpCodes.code200)
                .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.unAuthorisedAccess });
            }
          } else {
            const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': permissionCondition, 'role_permissions.is_allowed': true, 'roles.is_active': true };
            const joins = [
              { table: 'permissions', condition: ['permissions.id', 'role_permissions.permission_id'], type: 'inner' },
              { table: 'roles', condition: ['roles.id', 'role_permissions.role_id'], type: 'inner' },
            ];
            const rolePermission = await indexRepository.find('role_permissions', ['role_permissions.id','roles.name'], filters, 25, joins);
            if (rolePermission.status) {
              const filters = { 'role_permissions.role_id': roleId, 'permissions.slug': additionalPermission, 'role_permissions.is_allowed': true, 'roles.is_active': true };
              const joins = [
                { table: 'permissions', condition: ['permissions.id', 'role_permissions.permission_id'], type: 'inner' },
                { table: 'roles', condition: ['roles.id', 'role_permissions.role_id'], type: 'inner' },
              ];
              const additionalRolePermission = await indexRepository.find('role_permissions', ['role_permissions.id','roles.name'], filters, 25, joins);
              if (additionalRolePermission.status) {
                req.body.loginRoleName = rolePermission.data[0].name;
                next();
              } else {
                res
                  .status(httpCodes.code200)
                  .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.unAuthorisedAccess });
              }
            } else {
              res
                .status(httpCodes.code200)
                .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.unAuthorisedAccess });
            }
          }
        }
      } else {
        res
          .status(httpCodes.code200)
          .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.contractorConsultantNotAllowed });
      }
    } else {
      res
        .status(httpCodes.code403)
        .send({ statusCode: responseCodes.codeUnauthorized, message: responseMessages.common.loginRequired });
    }
  };
};

/**
 * Function for verifying an access token.
 * 
 * Overview:
 *   - This function is designed to verify an access token, which is typically used for authenticating users.
 *   - It takes an access token as input and attempts to verify it using the specified secret key.
 *   - If verification is successful, it extracts the user's ID from the token and returns it.
 *   - If verification fails or if no token is provided, it returns undefined.
 * 
 * Logic:
 *   - Check if a valid access token is provided.
 *   - If no token is provided, return undefined.
 *   - Attempt to verify the token using the specified secret key.
 *   - If verification is successful, 
 *     + extract the user's ID from the decoded token and return it.
 *   - If verification fails,
 *     + return undefined.
 * 
 * @param {string} accessToken - The access token to verify.
 * @param {function} next - The callback function to execute after verification (currently commented out in the code).
 * @returns {string|undefined} - The user's ID if verification is successful, or undefined if no token or verification failure.
 */
exports.verifyAccessToken = (accessToken, next) => {
  const token = accessToken;
  if (!token) {
    return;
  }

  const id = jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
    if (err) {
      return;
    }
    return decoded.id;
    // req.body.tenant_id = decoded.tenant_id
    // req.body.logginUserName = decoded.userName;
    // req.body.loginUserId = decoded.id;
    // req.body.created_by = decoded.id;
    // req.body.updated_by = decoded.id;
    // req.user = decoded.id;
    // next();
  });
  return id;
};


/**
 * Middleware for verifying token received from socket.
 * 
 * Overview: 
 *   - Checks if a valid authorixation token is present in the request headers.
 *   - Verify the token using the specified secret key.
 *   - If verification successful:
 *     + Adds decoded information from the token to the socket object, such as employee_id, tenant, role_id, is_super_admin, user_name and more.
 *   - Else(verification fails)
 *     + returns an appropriate response related to tenant.
 * 
 * Login:
 *   - Check if a token is included in the request's 'Authorization' header.
 *   - If a token is found:
 *     + Use JWT to verify the token using the provided secret key.
 *     + If verification is successful:
 *       ~ Add the decoded information from the token to the socket object for further processing.
 *     + Else(verification fails):
 *       ~ Return a 401 Unauthorized response with an error message indicating that the token is invalid.
 *   - Else(no token is found):
 *     + Return a 403 Forbidden Access response with an error message indicating that a token is required.
 * 
 * @param {*} socket - The socket object containing the authentication token in the headers.
 * @param {*} next - The next middleware or route handler to invoke if authentication is successful.
 */
exports.verifySocketToken = (socket, next = null) => {

  // Verify the token
  jwt.verify(socket.handshake.headers.authorization, process.env.TOKEN_SECRET_KEY, async (err, decoded) => {
    if (err) {
      return next(new Error(err + 'Token not Valid'));
    }
    socket.employee_id = decoded.id;
    socket.tenant = decoded.tenant_id;
    socket.role_id = decoded.role_id;
    socket.is_super_admin = decoded.is_super_admin;
    socket.user_name = decoded.userName;
    let tenantConnection = await getTenantConnection(decoded.tenant_id);
    if (tenantConnection) {
      socket.tenantConnection = tenantConnection;
      next();
    } else {
      return next(new Error('Failed To Connect To The Database ' + socket.tenant));
    }
  });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.verifyDomain = (req, res, next) => {

  // Extracting domain from the request
  const subdomain_name = (req.body.subdomain_name) ? req.body.subdomain_name : (req.query.subdomain_name) ? req.query.subdomain_name : (req.headers.subdomain_name) ? req.headers.subdomain_name : null;
  if (subdomain_name == null) {
    return res
      .status(httpCodes.code403)
      .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.subDomainNameRequired });
  } else {
    req.body.subdomain_name = subdomain_name;
    req.body.loginSubDomainName = subdomain_name;
    return next();
  }
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.verifyTenant = async (req, res, next) => {

  // Extracting domain from the request
  const tenant_id = (req.path.split('/')[4]) ? req.path.split('/')[4] : null;
  if (tenant_id == null) {
    return res
      .status(httpCodes.code403)
      .send({ statusCode: responseCodes.codeForbiddenAccess, message: responseMessages.common.tenantIdRequired });
  } else {
    req.body.tenant_id = tenant_id;
    return next();
  }
}

