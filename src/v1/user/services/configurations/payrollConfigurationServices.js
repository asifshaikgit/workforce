const moment = require('moment');
const format = require('../../../../../helpers/format');
const indexRepository = require('../../repositories/index');

/**
 * Dropdown Function to get payroll data.
 * 
 * Logic:
 *   ~ Call the repository function(dropdown) to fetch the data and send the condition(params).
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {object} [condition=null] - The condition to filter the data. Default is null.
 * @returns {Promise<object>} - A promise that resolves to an object containing the retrieved data.
 * If data is found, the object will have a 'status' property set to true and a 'data' property
 * containing the retrieved data. If no data is found, the object will have a 'status' property
 * set to false.
 */

const dropdown = async (condition) => {
  let dateFormat = await format.getDateFormat(); // date format
  
  /* default variables */
  let listingObject = [];
  const responseData = [];
  /* default variables */
  const payrollConfig = await indexRepository.find('payroll_configuration',['id', 'check_date'], condition);
  if (payrollConfig.status) {
    for (const key in payrollConfig.data) {
      const item = payrollConfig.data[key];
      listingObject = {
        id: item.id,
        check_date: moment(item.check_date).format(dateFormat),
      };
      responseData.push(listingObject);
    }
    return { status: true, data: responseData };
  } else {
    return { status: false, data: responseData };
  }
};

module.exports = { dropdown };
