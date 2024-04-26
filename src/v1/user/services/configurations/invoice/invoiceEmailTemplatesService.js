const indexRepository = require('../../../repositories/index');
const { event } = require('../../../../../../events/configurationActivityEvent');

/**
 * Store function to create a Invoice Email Template.
 * 
 * Logic:
 * - Create a new object 'newInvoiceSetting' with properties from the request body.
 * - Call the repository's store function to add the 'newInvoiceSetting' to the 'invoice_email_templates' table.
 * - Return the response from the repository.
 *    
 * @param {Object} body - The request body containing Net Pay Term details.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
  /* Creating new object */
  const newInvoiceSetting = {
    cc: body.cc,
    bcc: body.bcc,
    subject: body.subject,
    template: body.template,
    is_global: body.is_global,
    created_by: body.created_by,
    created_at: new Date(),
  };
  /* Creating new object */

  /**
   *  + Call the store repository function
   *    -Based on the status in store function response, segregate the response and prepare the response
  */
  const repositoryResponse = await indexRepository.store('invoice_email_templates', newInvoiceSetting);
  return repositoryResponse;
};

/**
 * Update function to modify an existing Invoice Email Template entry.
 * 
 * Logic:
 * - Create an 'updateinvoiceSetting' object with properties from the request body.
 * - Call the update repository function with 'condition' and 'updateinvoiceSetting' to modify the Invoice Email Template data in the 'invoice_email_templates' table.
 * - Return the response from the repository.
 *        
 * @param {Object} body - The request body containing updated Invoice Email Template details.
 * @param {Object} condition - The condition to identify the Invoice Email Template entry to update.
 * @returns {Object} Repository response.
 */
const update = async (body, condition) => {

  /* Creating update entry object */
  const updateinvoiceSetting = {
    cc: body.cc,
    bcc: body.bcc,
    subject: body.subject,
    template: body.template,
    is_global: body.is_global,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };

  let repositoryResponse = [];
  /* Creating update entry object */

  repositoryResponse = await indexRepository.update('invoice_email_templates', condition, updateinvoiceSetting, null, ["subject","template"]);
  return repositoryResponse;
};

/**
 * Index function to retrieve Invoice Email Template details based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch Invoice Email Template data from the 'invoice_email_templates' table based on the provided condition.
 * - If data exists:
 *   + Create a 'responseData' empty array.
 *   + Map the repository response data to 'totalDetails'.
 *   + Iterate over the 'totalDetails' and create a 'listingObject' object with selected response data properties.
 *   + Push each 'listingObject' to the 'responseData' array.
 *   + Return a response object with status true and the 'responseData' array.
 * - Else:
 *   + Return the repository response 'invoiceEmailTemplates'.
 *    
 * @param {Object} condition - The conditions to filter Invoice Email Template.
 * @returns {Object} Response with Invoice Email Template details.
 */
const index = async (condition) => {

  const invoiceEmailTemplates = await indexRepository.find('invoice_email_templates', ['*'], condition);
  if (invoiceEmailTemplates.status) {
    /* variables */
    const responseData = [];
    const totalDetails = invoiceEmailTemplates.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        cc: item.cc ? item.cc : [],
        bcc: item.bcc ? item.bcc  : [],
        subject: item.subject,
        template: item.template,
        is_global: item.is_global,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return invoiceEmailTemplates;
  }
};

module.exports = { index, store, update };
