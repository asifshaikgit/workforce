const axios = require('axios');
const { ocrURL, ocrToken } = require('../../../../../config/app');

/**
 * Function to call the third party OCR services
 *
 * Logic:
 *
 * @param {Object} body - The conditions to filter placement billing details.
 * @returns {Object} Repository response with formatted data or failure status.
 */
const index = async (body) => {

    let documentDetails = {
      url: body.document_url,
      id: body?.document_id,
    };

    let responseData = '';

    await axios.post(ocrURL+body.document_type+'/', documentDetails, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ocrToken,
      },
    }).then((response) => {
      responseData = { status: true, data : response.data };
    }).catch((error) => {
        responseData = { status: false, data : [], error : error };
    });
    return responseData;
}

module.exports = { index }
