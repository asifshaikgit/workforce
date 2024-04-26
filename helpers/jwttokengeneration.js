const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate the token string using employee and tenant details
const tokenGeneration = (data, tenant, subdomain_name) =>{
  let token = jwt.sign({ id : data.id, is_super_admin: data.is_super_admin, userName : data.display_name , tenant_id: tenant, subdomain_name : subdomain_name, role_id : data.role_id }, process.env.TOKEN_SECRET_KEY, { expiresIn: 86400 });
  return token;
}; 

// Generate the token string using employee and tenant details
const refreshTokenGeneration = (data, tenant, subdomain_name) =>{
  let token = jwt.sign({ id : data.id, is_super_admin: data.is_super_admin, userName : data.display_name, tenant_id: tenant, subdomain_name : subdomain_name, role_id : data.role_id }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: 604800 });
  return token;
}; 

module.exports = { tokenGeneration, refreshTokenGeneration };