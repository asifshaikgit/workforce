require('dotenv').config();

const aws = {
  accessKey : process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID : '' ,
  secretKey : process.env.AWS_SECRET_KEY ? process.env.AWS_SECRET_KEY : '' ,
  dnsName : process.env.AWS_DNS_NAME ? process.env.AWS_DNS_NAME : '' ,
  zoneId : process.env.AWS_ZONE_ID ? process.env.AWS_ZONE_ID : '',
  dnszoneId : process.env.AWS_DNS_ZONE_ID ? process.env.AWS_DNS_ZONE_ID : '',
  domain : process.env.AWS_DOMAIN ?  process.env.AWS_DOMAIN : '' ,
  region : process.env.AWS_REGION ? process.env.AWS_REGION : '',
  host : process.env.HOST ? process.env.HOST : '', 
};

module.exports = { aws };


