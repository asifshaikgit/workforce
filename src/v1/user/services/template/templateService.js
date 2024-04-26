require('dotenv').config();
const indexRepository = require('../../repositories/index');

/**
 * update Function to update templates data.
 * 
 * Logic:
 * - Deifne the condition to update data from body in params.
 * - Prepare templates data object.
 * - update the templates data into 'mail_template' table from the condition defined above. 
 * - Return the result of the templates data update.
 * 
 * @param {Object} body - The data to update the mail template with.
 * @param {Object} condition - The condtiton for the data.
 * @returns {Promise<Object>} - A promise that resolves to the response from the repository
 */
const update = async (body, condition) => {

    /* Creating update entry object */
    var updateData = {
        // name: body.name,
        description: body.description,
        subject: body.subject,
        template: body.template,
        updated_by: body.updated_by,
        updated_at: new Date()
    };
    /* Creating update entry object */

    /** 
     *  + Call the update repository function
     *    -Based on the status in update function response, segregate the response and prepare the response
     * 
    */
    var repositoryResponse = await indexRepository.update('mail_template', condition, updateData, null, ['template', 'subject']);
    return repositoryResponse;
};

/**
 * Index Function to get templates data.
 * 
 * Logic:
 * - Fetch the data from the 'mail_template' table by calling common findDistinct function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return status as false 
 * 
 * @returns {Promise<{status: boolean, data: Array<{module_slug: string, name: string}>}>} - An object with a status indicating success or failure, and an array of objects containing the module slug and name if successful.
 */
const findAll = async () => {
    var responseData = [];
    const moduleSlug = await indexRepository.findDistinct('mail_template', ['slug', '*'], {}, 0, [], null, null, null, false);
    if (moduleSlug.status) {
        for (let key in moduleSlug.data) {
            let item = moduleSlug.data[key]
            let listingObject = {
                id: item.slug,
                value: item.name
            }
            responseData.push(listingObject);
        }
        return { status: true, data: responseData };
    } else {
        return { status: false };
    }
}

/**
 * Index Function to get templates data.
 * 
 * Logic:
 * - Fetch the data from the 'mail_template' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop , define an object and push into the loop 
 *   + define the condition from the data in the loop
 *   + Fetch the data from 'template_parameters' table from the above defined condition
 *   + If data exists
 *   + Iterate the loop and define an object and push the object in to an array
 *   + Prepare the response 
 *   + return the response with status as true
 * 
 * @param {object} condition - The condition to filter the data from the 'mail_template' table.
 * @returns {object} - An object containing the status and data of the retrieved data.
 */
const index = async (condition) => {
    /* Default variables */
    var responseData = [];
    /* Default variables */

    const templateData = await indexRepository.find('mail_template', ['*'], condition, null, [], null, null, null, false);
    if (templateData.status) {
        // looping the data
        for (let key in templateData.data) {
            let item = templateData.data[key];
            let templateParams = await indexRepository.find('template_parameters', ['id','parameter'], { module_slug: item.slug }, null, [], null, null, null, false);
            let paramsArray = [];
            if (templateParams.status) {
                for (let params in templateParams.data) {
                    let param = templateParams.data[params];
                    let paramsObject = {
                        id : param.id,
                        parameter: param.parameter
                    }
                    paramsArray.push(paramsObject);
                }
            }
            /* Creating object */
            let listingObject = {
                slug: item.slug,
                name: item.name,
                description: item.description,
                subject: item.subject,
                template: item.template,
                params: paramsArray
            }
            /* Creating object */
            responseData.push(listingObject);
        }
    }

    return { status: true, data: responseData }
}

/**
 * Find Function to get templates data.
 * 
 * Logic:
 * - Fetch the data from the 'template_parameters' table using condition(param) by calling common find function.
 *  - If data exists,
 *   + Iterate the loop and push to an object 
 *   + Prepare the response 
 *   + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to search for in the 'template_parameters' table.
 * @returns {Promise<{ status: boolean, data?: any[] }>} - A promise that resolves to an object with a 'status' property indicating the success of the operation and a 'data' property containing the retrieved data if successful.
 */
const find = async (condition) => {
    const moduleSlug = await indexRepository.find('template_parameters', ['parameter', 'id'], condition, null, [], null, null, null, false);
    var total_details = moduleSlug.data;
    const responseData = [];

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of total_details) {
        const listingObject = {
            id : item.parameter,
            /* Using replace to remove the curly braces from the string */
            value: item.parameter.replace(/{{|}}/g, '').split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            /* Using replace to remove the curly braces from the string */
        };
        responseData.push(listingObject);
    }

    if (moduleSlug) {
        return { status: true, data: responseData };
    } else {
        return { status: false };
    }
};

module.exports = { find, findAll, index, update };