const { cleanUpObject } = require('../../../../helpers/globalHelper');
const { responseMessages } = require('../../../../constants/responseMessage');
const { dbConnection } = require('../../../../config/database');

/**
 * Funtion to create tenant account details in application admin table.
 *
 * @param {object} newAccount
 * @return Json
 */
const create = async (newAccount) => {
  let createObject = await cleanUpObject(newAccount);
  let insertRecords = dbConnection('tenant').insert(createObject).returning('*');
  return insertRecords;
};

/**
 * Funtion to apply filter to the query
 *
 * @param {object} query
 * @param {array} filters
 * @return {object} query
 */
const applyFilters = (query, filters) => {
  for (const key in filters) {
    if (filters[key]) {
      query.where(key, filters[key]);
    }
  }
  return query;
};


/**
 * Funtion to find the tenant details based on condition and apply filters.
 *
 * @param {object} condition
 * @param {array} filters
 * @return Json
 */
const find = async (filters = null) => {

  let tenantsData = await dbConnection('tenant')
    .select('*')
    .modify((query) => applyFilters(query, filters));

  if (tenantsData.length > 0) {
    return { status: true, data: tenantsData };
  } else {
    return { status: false, data: [] };
  }
};

/**
 * function to update the data in the collection based on condition.
 *
 * @param {object} adminDbConnection
 * @param {object} condition 
 * @param {object} updateData 
 * @return Json
 */
const update = async (condition, updateData) => {
  /*Establishing db connection with collection */
  var updateData = await dbConnection('tenant').where(condition).update(updateData);
  /*Establishing db connection with collection */
  if (updateData) {
    return { status: true, data: updateData };
  } else {
    return { status: false };
  }
};

/**
 * Funtion to find the tenant details based on condition and apply filters.
 *
 * @param {object} condition
 * @param {array} filters
 * @return Json
 */
const findAll = async () => {

  let tenantsData = await dbConnection.select().from('tenant').where({ is_active: true });
  if (tenantsData.length > 0) {
    return { status: true, data: tenantsData };
  } else {
    return { status: false, data: [] };
  }
};

module.exports = { create, find, update, findAll };
