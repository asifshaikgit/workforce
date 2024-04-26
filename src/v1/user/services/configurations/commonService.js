const { getConnection } = require('../../../../middlewares/connectionManager');
const indexRepository = require("../../../user/repositories/index");

const getRolesStatus = async (role_id) => {

    const roleData = await indexRepository.find('roles', ['*'], { id: role_id });
    const response = {
        name: roleData.data[0].name,
        Status: roleData.data[0].is_active ? 'Active' : 'In-Active',
    };

    return response;
}


const getRolesData = async (body, condition) => {

    const db = await getConnection();
    // getting the role details
    let roleInfo = {};
    if (body.roleInfo) {
        roleInfo = body.roleInfo;
    } else {
        roleInfo = await indexRepository.find('roles', ['id', 'name as Name', 'description as Description', 'is_editable'], condition);
        roleInfo = roleInfo?.data?.[0];
    }

    // getting the role permissions for the role
    const permissions = await db('permissions')
        .join('modules', 'permissions.module_id', 'modules.id')
        .leftJoin('role_permissions', function () {
            this.on('permissions.id', '=', 'role_permissions.permission_id').andOn(db.raw('?? = ?', ['role_permissions.role_id', condition.id]));
        })
        .select('permissions.id', 'modules.name as module_name', 'permissions.name as sub_module_name', 'role_permissions.is_allowed');
    roleInfo.subModuleChanges = permissions;
    return roleInfo;
}

/**
 * get skills details
 * @param {*} condition 
 * @returns 
 */
const getSkillsData = async (condition) => {
    const skillData = await indexRepository.find('skills', ['*'], condition);

    const responseData = {
        'Name': skillData.data[0].name,
        'Description': skillData.data[0].description,
        'Status': skillData.data[0].is_active === true ? 'Active' : 'In-active',
    };

    return responseData
}

/**
 * get Category Function to get category data.
 
 * Logic:
 * - Fetch the data from the 'employee_categories' table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {*} condition
 * @return {*} 
 */
const getCategory = async (condition) => {

    const fields = ['employee_categories.*', 'employment_types.name as employment_type_name'];

    const joins = [
        { table: 'employment_types', condition: ['employee_categories.employment_type_id', 'employment_types.id'], type: 'inner' },
    ];
    // getting category details
    const categoryData = await indexRepository.find('employee_categories', fields, condition, null, joins);

    /* Creating the object */
    const responseData = {
        'Name': categoryData.data[0].name,
        'Employement Type': categoryData.data[0].employment_type_name,
        'Description': categoryData.data[0].description,
        'Status': categoryData.data[0].is_active == true ? 'Active' : 'In-active'
    };
    /* Creating the object */

    return responseData
}

/**
 * Get on boarding document types Query on the document_type_id
 */
async function getOnBoardingDocumentData(id) {

    // getting onboarding details
    const document_type = await indexRepository.find('onboarding_document_types', ['*'], { id: id }, null, []);

    /* Creating the object */
    const responseData = {
        'Name': document_type.data[0].name,
        'Is Mandatory': document_type.data[0].is_mandatory,
        'Description': document_type.data[0].description,
        'Status': document_type.data[0].status == true ? 'Active' : 'In-active'
    };
    /* Creating the object */

    return responseData;
}


module.exports = { getRolesData, getRolesStatus, getSkillsData, getCategory, getOnBoardingDocumentData }