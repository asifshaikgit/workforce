const knex = require('knex');
const getNamespace = require('cls-hooked').getNamespace;
const { dbConnection, config } = require('../../config/database');
require('dotenv').config();

let tenantMapping;

/**
 * Get database configuration based on tenant information.
 *
 * Logic:
 * - Extract database user, database name, and database password from the 'tenant' object.
 * - Create a new configuration object by merging the 'config' object and the extracted database connection details.
 *
 * @param {Object} tenant - Tenant information object containing database connection details.
 * @returns {Object} Database configuration object.
 */
const getDatabaseConfig = (tenant) => {
  const { database_user: user, database_name: database, database_password: password } = tenant;

  return {
    ...config,
    connection: {
      ...config.connection,
      user,
      database,
      password,
    },
  };
};

/**
 * Connect to all active and non-deleted tenant databases.
 *
 * Logic:
 * - Query the 'tenant' table to retrieve all active tenants that are not deleted.
 * - Create a 'tenantMapping' array by mapping each active tenant to an object containing their ID and a database connection.
 *
 * Note:
 * - The function does not return a value but establishes connections to multiple tenant databases.
 * - In case of an error, it logs the error to the console.
 */
const connectAllDb = async () => {
  try {
    // Query the 'tenant' table to retrieve all active tenants that are not deleted
    const tenants = await dbConnection('tenant').select('*').where('is_active', true).whereNull('deleted_at');

    // Create a 'tenantMapping' array by mapping each active tenant to an object containing their ID and a database connection
    tenantMapping = await Promise.all(tenants.map(async (tenant) => ({
      id: tenant.id,
      connection: await knex(getDatabaseConfig(tenant)),
    })));

    // Logging the tenant mapping can be added for debugging or monitoring purposes
    // console.log(tenantMapping)
  } catch (error) {
    // Log any errors to the console
    console.error(error);
  }
};

/**
 * Get the database connection for a specific tenant based on their ID.
 *
 * Logic:
 * - Check if the 'tenant_id' parameter is not null.
 * - If 'tenant_id' is not null, find the corresponding tenant in the 'tenantMapping' array.
 * - If the tenant is found, return their database connection.
 * - If the tenant is not found or 'tenant_id' is null, return null.
 *
 * @param {number} tenant_id - The ID of the tenant for which to retrieve the database connection.
 * @returns {Object|null} - The database connection for the specified tenant or null if not found.
 */
const getTenantConnection = (tenant_id) => {
  if (tenant_id != null) {
    // Find the corresponding tenant in the 'tenantMapping' array based on 'tenant_id'
    const tenant = tenantMapping.find((tenant) => tenant.id === tenant_id);

    // If the tenant is found, return their database connection; otherwise, return null
    if (!tenant) return null;
    return tenant.connection;
  } else {
    // If 'tenant_id' is null, return null
    return null;
  }
};

/**
 * Get the database connection for a specific tenant or the default connection if not set.
 *
 * Logic:
 * - Create or retrieve a namespace with the name 'codetruWorkforce' using 'getNamespace'.
 * - Attempt to get the database connection ('conn') from the namespace.
 * - If 'conn' is not found in the namespace:
 *   - Check if 'tenant_id' is not null.
 *   - If 'tenant_id' is not null:
 *     ~ call 'getTenantConnection' to retrieve the connection for the specified tenant.
 *   - If 'tenant_id' is null:
 *     ~ throw an error indicating that no connection is set for any tenant database.
 * - Return the retrieved connection or throw an error if no connection is found.
 *
 * @param {number|null} tenant_id - The ID of the tenant for which to retrieve the database connection (or null for the default connection).
 * @returns {Object} - The database connection for the specified tenant or the default connection.
 * @throws {Error} - Throws an error if no connection is set.
 */
const getConnection = async (tenant_id = null) => {
  // Create or retrieve a namespace with the name 'codetruWorkforce' using 'getNamespace'
  const nameSpace = getNamespace('codetruWorkforce');

  // Attempt to get the database connection ('conn') from the namespace
  const conn = nameSpace.get('connection');

  // If 'conn' is not found in the namespace:
  if (!conn) {
    // Check if 'tenant_id' is not null
    if (tenant_id != null) {
      // If 'tenant_id' is not null, call 'getTenantConnection' to retrieve the connection for the specified tenant
      const connec = await getTenantConnection(tenant_id);
      return connec;
    } else {
      // If 'tenant_id' is null, throw an error indicating that no connection is set for any tenant database
      throw new Error('Connection is not set for any tenant database');
    }
  }
  // Return the retrieved connection or throw an error if no connection is found
  return conn;
};

/**
 * Get an administrative connection to a specific tenant database.
 *
 * Logic:
 * - Create a 'tempConnection' object by copying the 'config' object and updating the 'database' and 'password' properties.
 * - Initialize a new 'connection' by creating a knex instance with the 'tempConnection'.
 * - Return the 'connection' for administrative access to the specified tenant database.
 *
 * @param {string} database - The name of the tenant database to connect to.
 * @returns {Object} - The administrative connection to the specified tenant database.
 */
const getAdminConnectionToTenantDb = async (database) => {
  try {
    // Create a 'tempConnection' object by copying the 'config' object and updating the 'database' and 'password' properties
    let tempConnection = {
      ...config,
      connection: {
        ...config.connection,
        database,
        password: process.env.DB_PASSWORD
      },
    };
    // Initialize a new 'connection' by creating a knex instance with the 'tempConnection'
    let connection = knex(tempConnection);
    // Return the 'connection' for administrative access to the specified tenant database
    return connection;
  } catch (error) {
    console.error(error);
  }
};

module.exports = { connectAllDb, getTenantConnection, getConnection, getAdminConnectionToTenantDb };