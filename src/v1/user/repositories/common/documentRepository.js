const { cleanUpObject } = require('../../../../../helpers/globalHelper');
const { getConnection } = require('../../../../middlewares/connectionManager');

/**
 * Funtion to Apply filters to the query.
 * @param {object} query
 * @param {object} filters
 * @return Json
 */
const applyFilters = (query, filters) => {
  for (const key in filters) {
    if (filters[key]) {
      /* Check if the key is id then apply = operator */
      if (key === 'id' && Array.isArray(filters[key])) {
        query.whereIn(key, filters[key]);
      } else if (key === 'id') {
        query.where(key, '=', filters[key]);
      }
    }
  }
  return query;
};

/**
 * Funtion to create tenant account details in admin table.
 *
 * @param {object} documentsData
 * @return Json
 */
const store = async (documentsData, tenant_id = null) => {
  const dbConnection = await getConnection(tenant_id);
  const createObject = await cleanUpObject(documentsData);
  const insertRecords = await dbConnection('temp_upload_documents').insert(createObject).returning('*');
  return insertRecords;
};

/**
 * Funtion to create tenant account details in admin table.
 *
 * @param {object} documentsData
 * @return Json
 */
const storeCommon = async (tableName, documentsData, tenant_id = null) => {
  const dbConnection = await getConnection(tenant_id);
  const createObject = await cleanUpObject(documentsData);
  const insertRecords = await dbConnection(tableName).insert(createObject).returning('*');
  return insertRecords;
};

/**
 * Funtion to create tenant account details in admin table.
 *
 * @param {object} filters
 * @return Json
 */
const find = async (filters = null, tenant_id = null) => {
  const dbConnection = await getConnection(tenant_id);
  const findData = await dbConnection('temp_upload_documents')
    .select()
    .modify((query) => applyFilters(query, filters));
  return findData;
};

module.exports = { store, storeCommon, find };
