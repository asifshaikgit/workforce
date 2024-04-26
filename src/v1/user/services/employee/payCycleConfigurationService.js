const indexRepository = require("../../repositories/index")
const { event } = require('../../../../../events/employeeActivityEvent');
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');

/**
 * Index function to retrieve a list of Pay Configuration entries based on conditions.
 * 
 * Logic:
 * - Define the fields to fetch in the query result.
 * - Set up the table joins for the query to include relevant data from the 'employee' table.
 * - Fetch pay cycle configurations based on the provided conditions, fields, and joins.
 * - If the retrieval is successful:
 *   - Initialize variables for listing data and response data.
 *   - Iterate through the retrieved pay cycle configurations to prepare the response data.
 *   - For each pay cycle configuration:
 *     + Retrieve pay rate configurations for the employee.
 *     + Create a listing object with the necessary properties.
 *   - Use Promise.all to wait for the listing data to be processed.
 *   - Return the response with the formatted data.
 * - If there's an error during retrieval, return an error response.
 * Retrieves pay cycle configurations based on the given condition and returns the data
 * along with associated pay rate configurations.
 * @param {object} condition - The condition to filter the pay cycle configurations.
 * @returns {object} - An object containing the status and data of the retrieved pay cycle configurations.
 * If successful, the data will also include the associated pay rate configurations.
 */
const index = async (condition) => {

  /* Setting up the joins and conditions and sort and fields */
  const fields = ['pay_type_configuration.id', 'pay_type_configuration.employee_id', 'pay_type_configuration.pay_type', 'pay_type_configuration.is_global', 'pay_type_configuration.pay_value', 'pay_type_configuration.payroll_pay', 'employee.balance_amount', 'employee.standard_pay_amount', 'employee.hours_worked']; // fields to fetch

  const joins = [
    { table: 'employee', condition: ['employee.id', 'pay_type_configuration.employee_id'], type: 'inner' }
  ];

  /* Setting up the joins and conditions and sort and fields */

  var payCycleConfigurations = await indexRepository.find('pay_type_configuration', fields, condition, 0, joins, null, null, null, false);

  if (payCycleConfigurations.status) {

    /* Variables */
    var listingObject = '';
    var responseData = '';
    var total_details = payCycleConfigurations.data;
    /* Variables */

    /* Using Map to iterate the loop and prepare the response */
    listingData = await total_details.map(async (item) => {

      // Pay rates for the employee
      let payRateFields = ['id', 'pay_in', 'from_hour', 'to_hour', 'rate as value', 'rate as rate'];
      let payRateCondition = { 'pay_type_configuration_id': item.id };

      var payRatesData = await indexRepository.find('pay_rate_configuration', payRateFields, payRateCondition, 0, [], null, 'id', 'asc', false); // Query to fecth the pay_rate_configuration

      listingObject = {
        id: item.id,
        pay_type: item.pay_type,
        payroll_pay: item.payroll_pay,
        pay_value: item.pay_value ? item.pay_value : '',
        employee_id: item.employee_id,
        is_global: item.is_global,
        pay_rate_configurations: payRatesData.data
      };
      return listingObject;
    });
    /* Using Map to iterate the loop and prepare the response */

    /* Using promise to wait till the address map completes. */
    responseData = await Promise.all(listingData);
    /* Using promise to wait till the address map completes. */

    return { status: true, data: responseData };
  } else {
    return payCycleConfigurations;
  }
}

/**
 * Store function to create a new Pay Configuration entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create a new object 'newPayCycleSetting' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.store' function to add 'newPayCycleSetting' to the 'pay_type_configuration' table within the transaction.
 * - Initialize an empty array 'newPayRates'.
 * - If 'pay_type' is 2:
 *   - Loop through each item in 'pay_rate_configurations':
 *     + Create a 'payRateObject' with properties 'pay_type_configuration_id', 'pay_in', 'from_hour', 'to_hour', and 'rate'.
 *     + Add 'payRateObject' to the 'newPayRates' array.
 *   - Call 'transactionRepository.store' to add 'newPayRates' to the 'pay_rate_configuration' table within the transaction.
 * - If 'pay_type' is 1:
 *   - Store 'pay_value' and 'payroll_pay' in the 'pay_type_configuration' table.
 * - Commit the transaction after successfully storing all data.
 * - Trigger an activity event for creating a new pay configuration record.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * Stores the payroll configuration and pay rate configurations in the database.
 * @param {Object} body - The request body containing the payroll configuration data.
 * @returns {Promise<Object>} - A promise that resolves to the stored payroll configuration.
 */
const store = async (body) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Creating new object */
    const newpayCycleSetting = {
      employee_id: body.employee_id,
      pay_type: body.pay_type,  //  1 - Salary and 2 - Hourly
      pay_value: body.pay_value != '' ? body.pay_value : null,
      payroll_pay: body.payroll_pay != '' ? body.payroll_pay : null,
      is_global: body.is_global,
      created_by: body.created_by,
      created_at: new Date()
    };

    let payrollConfig = await transactionRepository.store(trx, 'pay_type_configuration', newpayCycleSetting); // Storing the payroll config information

    var payRateObject = [];
    var newPayRates = [];

    PayRates = await body.pay_rate_configurations.map(async (item) => {
      payRateObject = {
        pay_type_configuration_id: payrollConfig.data[0].id,
        pay_in: item.pay_in,  // 1- percentage, 2- value
        from_hour: item.from_hour,
        to_hour: item.to_hour != '' ? item.to_hour : null,
        rate: item.rate
      };
      return payRateObject;
    });
    /*using promise to wait till the map function completes.*/
    newPayRates = await Promise.all(PayRates)
    /*using promise to wait till the map function completes.*/
    /* Creating new object */

    if (body.pay_rate_configurations.length > 0) {
      await transactionRepository.store(trx, 'pay_rate_configuration', newPayRates); // Storing the payrate information
    }

    /* Activity track store */
    activity = {
      employee_id: body.employee_id,
      employee_name: body.employee_name,
      reference_id: body.employee_reference_id,
      pay_type: body.pay_type == 1 ? 'Salary' : 'Hourly',
      // employee_sub_module: 14,
      referrable_type: 15, 
      referrable_type_id: payrollConfig.data[0].id,
      action_type: 1, //1 for create 
      created_by: body.created_by,
    };
    event.emit('employeeStoreActivity', { activity });
    /* Activity track store */

    await trx.commit();
    return { status: true, payrollConfig };
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

/**
 * Update function to modify an existing Pay Configuration entry.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Determine the condition for the update based on 'id' and 'existing_pay_type_configuration_id'.
 * - Fetch the pay type configuration data before the update.
 * - Create an update object 'updatePayCycleSetting' with properties extracted from the request 'body'.
 * - Call the 'transactionRepository.update' function to modify the 'pay_type_configuration' table within the transaction.
 * - Initialize an empty array 'newPayRates' for new pay rates.
 * - Loop through 'pay_rate_configurations' and create 'payRateObject' for each item.
 * - Use a Promise to wait for all the 'PayRates' to be processed.
 * - Destroy existing pay rate configurations related to the 'pay_type_configuration'.
 * - If 'pay_rate_configurations' has entries, store new pay rate configurations.
 * - Fetch the pay type configuration data after the update.
 * - Trigger an activity event for updating the pay configuration record.
 * - Commit the transaction after successfully updating all data.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * Updates the pay cycle setting and pay rate configurations based on the provided body object.
 * @param {Object} body - The body object containing the data for the update.
 * @returns {Promise} A promise that resolves with the repository response.
 */
const update = async (body, condition) => {

  let trx;
  try {

    //databse connection
    const db = await getConnection();
    trx = await db.transaction()
    //databse connection

    /* Writing condition to the update entry */
    if (condition.id === undefined) {
      var condition = { id: body.existing_pay_type_configuration_id }
    }
    /* Writing condition to the update entry */

    /**Fetching payrate configaration data before data */
    var payCycleConfigurations = await indexRepository.find('pay_type_configuration', ['pay_type'], condition);
    beforeUpdateData = { 'Pay type': payCycleConfigurations.data[0].pay_type == 1 ? 'Salary' : 'Hourly' }
    /**Fetching payrate configaration data before data */

    /* Creating update entry object */
    const updatepayCycleSetting = {
      employee_id: body.employee_id,
      pay_type: body.pay_type,
      pay_value: body.pay_type == '1' ? (body.pay_value != '' ? body.pay_value : null) : null,
      payroll_pay: body.pay_type == '1' ? (body.payroll_pay != '' ? body.payroll_pay : null) : null,
      is_global: body.is_global,
      updated_by: body.updated_by,
      updated_at: new Date()
    };
    /* Creating update entry object */

    var repositoryResponse = await transactionRepository.update(trx, 'pay_type_configuration', condition, updatepayCycleSetting); // update the payroll config information

    PayRates = await body.pay_rate_configurations.map(async (item) => {
      payRateObject = {
        pay_type_configuration_id: condition.id,
        pay_in: item.pay_in,
        from_hour: item.from_hour,
        to_hour: item.to_hour != '' ? item.to_hour : null,
        rate: item.rate
      };
      return payRateObject;
    });
    /*using promise to wait till the map function completes.*/
    newPayRates = await Promise.all(PayRates)
    /*using promise to wait till the map function completes.*/

    await transactionRepository.destroy(trx, 'pay_rate_configuration', { pay_type_configuration_id: condition.id });

    if (body.pay_rate_configurations.length > 0) {
      await transactionRepository.store(trx, 'pay_rate_configuration', newPayRates); // update the payroll config information
    }

    /**Fetching payrate configaration data after update data */
    afterUpdateData = { 'Pay type': body.pay_type == 1 ? 'Salary' : 'Hourly' }
    /**Fetching payrate configaration data after update data */

    /**Activity track */
    activity = {
      employee_id: body.employee_id,
      employee_name: body.employee_name,
      reference_id: body.employee_reference_id,
      // employee_sub_module: 14,
      referrable_type: 15, 
      referrable_type_id: condition.id,
      action_type: 2,
      created_by: body.updated_by,
    }
    event.emit("employeeUpdateActivity", { activity, beforeUpdateData, afterUpdateData })
    /**Activity track */

    await trx.commit();
    return { status: true, repositoryResponse };
  } catch (error) {
    // Handle errors and rollback the transaction
    if (trx) {
      await trx.rollback();
    }
    return { status: false, error: error.message };
  }
};

module.exports = { index, store, update };
