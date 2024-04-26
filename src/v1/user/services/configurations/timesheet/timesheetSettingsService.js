const indexRepository = require('../../../repositories/index');

/**
 * update Function to update timesheet setting data.
 * 
 * Logic:
 * - Prepare timesheet setting data object.
 * - update the timesheet setting data into 'timesheet_settings' table from the condition in params. 
 * - Return the result of the timesheet setting data update.
 *
 * @param {Object} body - The data to update the timesheet settings with.
 * @param {any} condition - The condition to update data.
 * @returns {Promise<Object>} - A promise that resolves to the repository response.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
    /* Creating update entry object */

  /**
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     *
    */
  const repositoryResponse = await indexRepository.update('timesheet_settings', condition, updateData);
  return repositoryResponse;
};

module.exports = { update };
