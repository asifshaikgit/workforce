
const { responseMessages } = require('../../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../../utils/log')
const { responseHandler } = require('../../../../../responseHandler')
const { tryCatch } = require('../../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../../error/InvalidRequestError')
const exportService = require("../../../services/export/employee/employeeExportServices")
const employeeDataJson = require('../../../../../../helpers/employeeJson')
const format = require('../../../../../../helpers/format');

/**
* validate the Listing request
* If request validation success call services function.
*
* @param {object} req
* @param {object} res
* @return Json
* @throws InvalidRequestError
*/
const employeeExport = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Getting complete employee Details Request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    var request_id = req.body.request_id;
    let filters = {};
    if (req.body.status != '' && req.body.status != null) {
        filters.status = req.body.status
    }
    if (req.body.employment_type_id != '' && req.body.employment_type_id != null) {
        filters.employment_type_id = req.body.employment_type_id
    }
    /* Default Variable */

    if (request_id != undefined && request_id != '') {
       const exportData = await exportService.employeeInfo(req.body,filters, dateFormat);
        if (!exportData.status) {
            responseData = { statusCode: responseCodes.codeInternalError, error: exportData.error, message: responseMessages.common.noRecordFound }
        }
        else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, path: exportData.filepath };
        }
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
    /* Writing validation rules to the input request */

    /* Log Response */
    logResponse('info', req, responseData, "Getting employee complete Details Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
}
);

/**
* validate the Listing request
* If request validation success call services function.
*
* @param {object} req
* @param {object} res
* @return Json
* @throws InvalidRequestError
*/
const employeeExportJson = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "Getting complete employee JSON Request.");
    /* Log Request */
    var request_id = req.query.request_id;
    if (request_id != undefined && request_id != '') {
        const responseData = { statusCode: responseCodes.codeSuccess, data : employeeDataJson.employeeJson }
        /* Return the response */
        responseHandler(res, responseData);
         /* Return the response */
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
});

module.exports = { employeeExport, employeeExportJson}