const indexRepository = require('../../repositories/index');

/**
 * Index Function to get permission data.
 * 
 * Logic:
 * - Fetch the data from the 'permissions' table by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @returns {object} - An object containing the status and data of the retrieved permissions.
 * If the status is true, the data will contain an array of state objects.
 * If the status is false, the data will contain an empty array and the message will contain error message.
 */
const index = async () => {
  /* variables */
  const tableName = 'permissions';
  const fields = ['modules.name as module_name', 'permissions.id', 'permissions.name', 'permissions.parent_slug', 'permissions.module_id', 'permissions.slug'];
  const joins = [
    { table: 'modules', condition: ['modules.id', 'permissions.module_id'], type: 'inner' },
  ];
  const condition = { 'permissions.parent_slug': null };
  /* variables */
  const permissions = await indexRepository.find(tableName, fields, condition, 0, joins, null, 'permissions.id', 'ASC');
  const responseData = {};
  if (permissions.status) {
    for (const obj in permissions.data) {
      responseData[`${permissions.data[obj].module_name}`] = [];
    }
    for (const obj in permissions.data) {
      const additionalData = [];
      const additionalObject = {};
      const module = permissions.data[obj].module_name;
      if (permissions.data[obj].name !== 'Additional Permissions') {
        responseData[module].push({
          permission_name: permissions.data[obj].name,
          slug: permissions.data[obj].slug,
          permission_id: permissions.data[obj].id,
        });
      } else {
        const condition = { module_id: permissions.data[obj].module_id, parent_slug: permissions.data[obj].slug };
        const additionalPermissions = await indexRepository.find('permissions', ['id', 'name', 'slug'], condition, 0, [], null, 'permissions.id', 'ASC');
        if (additionalPermissions.status) {
          for (const key in additionalPermissions.data) {
            const item = additionalPermissions.data[key];
            additionalData.push({
              permission_name: item.name,
              slug: item.slug,
              permission_id: item.id,
            });
          }
          additionalObject.additional_permissions = additionalData;
          const module = permissions.data[obj].module_name;
          responseData[module].push(additionalObject);
        } else {
          additionalObject.additional_permissions = [];
          const module = permissions.data[obj].module_name;
          responseData[module].push(additionalObject);
        }
      }
    }
    return { status: true, data: responseData };
  } else {
    return { status: false, data: [], error: 'Failed to fetch data' };
  }
};

module.exports = { index };
