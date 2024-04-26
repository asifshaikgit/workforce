const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Dropdown Function to get payroll data.
 * 
 * Logic:
 *   ~ Establish the database conntestion using getConnection( functioon).
 *  - Fetch the data from 'payroll_configuration' table using the condition from params order by the frequency date
 *   + if data exists
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return status as false 
 * 
 * @param {object} [condition=null] - The condition to filter the data. Default is null.
 * @returns {Promise<object>} - A promise that resolves to an object containing the retrieved data.
 * If data is found, the object will have a 'status' property set to true and a 'data' property
 * containing the retrieved data. If no data is found, the object will have a 'status' property
 * set to false.
 */
const dropdown = async (condition = null) => {
  const db = await getConnection();
  const response = await db('payroll_configuration')
    .select(db.raw('to_char("frequency_date", \'YYYY-MM-DD\') as frequency_date'), 'id', 'is_raised')
    .where(condition)
    .orderBy('frequency_date', 'desc');
  if (response.length > 0) {
    return { status: true, data: response };
  } else {
    return { status: false };
  }
};

module.exports = { dropdown };
