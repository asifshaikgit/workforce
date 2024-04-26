const indexRepository = require('../src/v1/user/repositories/index');

/**
 * Get the date format from the organization data.
 *
 * Overview:
 * This function retrieves the date format used by the organization by querying the 'organization' table.
 * It's a critical component of date formatting in the application.
 *
 * Logic:
 *  - Asynchronously query the 'organization' table using the 'indexRepository.find' function to retrieve the 'date_format'.
 *  - Extract the date format from the response data, assuming it's the first (or only) result.
 *  - Return the retrieved date format, which is a string.
 *
 * @returns {string} - The date format used by the organization.
 */
const getDateFormat = async () =>{
    try {
        //  Fetch the date format from the organization data
        var organizationData = await indexRepository.find('organization', ['date_format']); // Fetch the organization signature
        // Extract the date format (assuming it's the first result)
        var dateFormat = organizationData.data[0].date_format; // Fetch the organization signature
        // Return the organization's date format
        return dateFormat;
    } catch (error) {
        // Handle any potential errors here
        console.error('Error while fetching the date format:', error);
        throw error; // You may want to handle or propagate the error as needed.
    }
}

module.exports = {  getDateFormat };