'use strict';

const { createLogger, format, transports } = require('winston');
const logDir = './logs';
const moment = require('moment');

const logger = function (tenantName) {
  return createLogger({
    // change level if in dev environment versus production
    level: 'info',
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json()),
    transports: [
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          format.printf(
            (info) => `${info.message}`,
          ),
        ),
      }),
      // new winston.transports.Console(),
      new transports.File({
        filename: `${logDir}/${tenantName}/${moment().format('DD-MM-YYYY')}.log`,
      }),
    ],
  });
};

module.exports = logger; // is now a function
