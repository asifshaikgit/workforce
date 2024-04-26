const indexRepository = require('../../../repositories/index');
const format = require('../../../../../../helpers/format');
const { responseMessages } = require('../../../../../../constants/responseMessage')

/**
 * Stores a new immigration document type in the database.
 * 
 * Logic:
 *   - Create a 'newDocumentType' object containing the immigration document type data (body).
 *   - Call a common indexRepository 'store' function to store 'newDocumentType' object into the 'immigration_document_types' table.
 *   - Return the response from the repository as 'response'.
 * 
 * @param {object} body - The request body containing the immigration document type details.
 * @returns {Promise<object>} - A promise that resolves to the stored immigration document type information.
 */
const store = async (body) => {
  const newdocumentTypes = {
    name: body.name,
    description: body.description,
    referrable_type: body.referrable_type,
    is_active: body.is_active,
    created_by: body.created_by,
    created_at: new Date(),
  };
  const response = await indexRepository.store('immigration_document_types', newdocumentTypes);
  return response  
};

/**
 * Updates an existing immigration document type in the database.
 * 
 * Logic:
 *   - Create an 'updateData' object containing the updated immigration document type data (body).
 *   - Call a common indexRepository 'update' function to update the 'immigration_document_types' table
 *     based on the provided 'condition' and 'updateData'.
 *   - Return the response from the repository as 'response'.
 * 
 * @param {object} body - The request body containing the updated immigration document type details.
 * @param {object} condition - The condition to identify the document type to be updated.
 * @returns {Promise<object>} - A promise that resolves to the updated immigration document type information.
 */
const update = async (body, condition) => {
  const updateData = {
    name: body.name,
    referrable_type: body.referrable_type,
    is_active: body.is_active,
    description: body.description,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  const response = await indexRepository.update('immigration_document_types', condition, updateData);
  return response
}

/**
 * Retrieves a paginated listing of immigration document types based on the given condition with optional sorting.
 * 
 * Logic:
 *   - Set default variables for the table name, fields, and joins.
 *   - Call the indexRepository 'findByPagination' function to fetch immigration document types data from the 'immigration_document_types' table based on the provided condition, page, limit, sort_column, and sort_order.
 *   - If data exists:
 *     + Create an empty array 'responseData'.
 *     + Map the repository response data (documentTypes.data) to 'totalDetails'.
 *     + Map the pagination details (documentTypes.pagination) to 'paginationDetails'.
 *     + Iterate over 'totalDetails' and create a 'listingObject' object with response data.
 *     + Push the 'listingObject' object to the 'responseData' array.
 *     + Return the response object with status true, responseData, and paginationDetails.
 *   - Else(data doesn't exist):
 *     + Return the response object with status false.
 *
 * @param {Object} condition - The condition to filter the immigration document types.
 * @param {number} page - The page number of the listing.
 * @param {number} limit - The maximum number of items per page.
 * @param {string} sort_column - The column to sort the results by.
 * @param {string} sort_order - The sorting order (asc or desc).
 * @returns {Object} An object containing the status, data, and pagination_data of the listing.
 */
const listing = async (condition, page, limit, sort_column, sort_order) => {
    /* Default variables */
    const tableName = 'immigration_document_types';
    /* Default variables */

    const fields = ['immigration_document_types.*', 'create.display_name as create_emp', 'update.display_name as updated_emp'];
    const joins = [
      { table: 'employee as create', alias: 'create', condition: ['immigration_document_types.created_by', 'create.id'], type: 'left' },
      { table: 'employee as update', alias: 'update', condition: ['immigration_document_types.updated_by', 'update.id'], type: 'left' },
    ];

    const documentTypes = await indexRepository.findByPagination(tableName, fields, condition, joins, page, limit, sort_column, sort_order);
  
    if (documentTypes.status) {
      /* variables */
      const responseData = [];
      const totalDetails = documentTypes.data;
      const paginationDetails = documentTypes.pagination;
      /* variables */
  
      let serialNo = (page - 1) * limit + 1;
      // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
      for (const item of totalDetails) {
        const listingObject = {
          serial_no: serialNo,
          id: item.id,
          name: item.name,
          referrable_type: item.referrable_type,
          description: (item.description !== null ? item.description : ''),
          is_active: item.is_active,
          created_by: (item.created_by !== null ? item.create_emp : 'System'),
          updated_by: (item.updated_by !== null ? item.updated_emp : ''),
        };
        serialNo++;
        responseData.push(listingObject);
      }
  
      return {
        status: true,
        data: responseData,
        pagination_data: paginationDetails,
      };
    } else {
      return {
        status: false
      };
    }
};

/**
 * Updates the status of an Immigration Document Type record in the database with the provided data.
 * 
 * Logic:
 *   - Create an 'updateData' object containing the new status ('is_active'), the user who updated ('updated_by'), and the update timestamp ('updated_at').
 *   - Call the indexRepository 'update' function to update the status of the Immigration Document Type record in the 'immigration_document_types' table based on the provided condition.
 *   - Return the response from the repository 'repositoryResponse'.
 * 
 * @param {Object} body - The data to update the status of the Immigration Document Type.
 * @param {Object} condition - The condition that specifies which record to update.
 * @returns {Promise<Object>} - A promise that resolves to the updated status of the Immigration Document Type record.
 * @throws {Error} - If there is an error updating the status of the Immigration Document Type.
 */
const updateStatus = async (body, condition) => {

  /* storeing update entry object */
  const updateData = {
    is_active: body.is_active,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* storeing update entry object */

  const repositoryResponse = await indexRepository.update('immigration_document_types', condition, updateData);
  return repositoryResponse;
};

/**
 * Soft deletes an immigration document type in the 'immigration_document_types' table by updating the 'is_active' field.
 * 
 * Logic:
 *   - Create an 'updateData' object containing fields for soft deletion.
 *   - Call the indexRepository 'update' function to update the 'immigration_document_types' table based on the provided condition and 'updateData'.
 *   - Return the response from the repository.
 *
 * @param {Object} body - The data for updating the immigration document type for soft deletion.
 * @param {Object} condition - The condition to identify the immigration document type to be soft-deleted.
 * @returns {Object} - A promise that resolves to the response from the repository.
 */
const destroy = async (body, condition) => {

  /**
   * Softdelete i.e update object in immigration_document_types table
   */
  var updateData = {
    is_active: false,
    deleted_at: new Date(),
    updated_at: new Date(),
    updated_by: body.updated_by
  };

  var repositoryResponse = await indexRepository.update('immigration_document_types', condition, updateData);

  return repositoryResponse;
}

module.exports = { store, update, listing, updateStatus, destroy }
