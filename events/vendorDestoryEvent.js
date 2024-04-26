const AwaitEventEmitter = require('await-event-emitter').default;
let event = new AwaitEventEmitter();
const indexRepository = require("../src/v1/user/repositories/index");

/**
 * Handles the 'VendorData' event and performs a series of updates and deletions
 * on various repositories based on the provided data.
 * @param {Object} data - The data object containing the condition and updateData.
 * @returns {Promise} A promise that resolves with the repository response.
 */
/**
 * Event handler for the 'VendorData' event. Updates various repositories with the provided data.
 * @param {object} data - The data object containing the condition and updateData.
 * @returns {Promise<object>} - A promise that resolves to the repository response.
 */
event.on('VendorData', async (data) => {

  await indexRepository.update('vendor_address', data.condition, data.updateData); // update in vendor address table

  await indexRepository.update('vendor_contacts', data.condition, data.updateData);// update in vendor contacts table

  let condition = { id: data.condition.vendor_id }; // condition

  /**
   * Softdelete i.e update the vendor data object
   */
  let updateData = {
    is_active: false,
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: data.updateData.updated_by,
  };

  await indexRepository.update('vendors', condition, updateData); // update vendor data

});

module.exports = { event };
