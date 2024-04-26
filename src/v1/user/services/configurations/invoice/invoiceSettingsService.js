const indexRepository = require('../../../repositories/index');

/**
 * Update function to modify an existing invoice Setting.
 * 
 * Logic:
 * - Create an 'updateData' object with properties from the request body.
 * - Call the update repository function with 'condition' and 'updateData' to modify the Invoice Setting data in 'invoice_settings_information' table.
 * - Return the response from the repository.
 *    
 * @param {Object} body - The request body containing the updated invoice settings data.
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
   *  -Based on the status in update function response, segregate the response and prepare the response
   *
  */
  const repositoryResponse = await indexRepository.update('invoice_settings_information', condition, updateData);
  return repositoryResponse;
};

module.exports = { update };
