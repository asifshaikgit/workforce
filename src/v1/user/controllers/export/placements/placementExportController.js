const { responseMessages } = require('../../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../../constants/responseCodes')
const { logRequest, logResponse } = require('../../../../../../utils/log')
const { responseHandler } = require('../../../../../responseHandler')
const { tryCatch } = require('../../../../../../utils/tryCatch')
const InvalidRequestError = require('../../../../../../error/InvalidRequestError')
const placementExportServices = require("../../../services/export/placements/placementExportServices")
const format = require('../../../../../../helpers/format');
const { check, validationResult } = require('express-validator');
const { regexPatterns } = require('../../../../../../constants/regexPatterns');
const indexService = require('../../../services/index');
const { removeEmptyAndUndefinedKeys } = require('../../../../../../helpers/globalHelper');
const moment = require('moment');

/**
* validate the Listing request
* If request validation success call services function.
* billExportServices
* @param {object} req
* @param {object} res
* @return excle file
* @throws InvalidRequestError
*/
const placementExport = tryCatch(async (req, res) => {

    let dateFormat = await format.getDateFormat(); // date format

    /* Log Request */
    logRequest('info', req, "Getting Placement Details listing request");
    /* Log Request */

    /* Default Variable */
    var responseData;
    /* Default Variable */

    // Writing validation rules to the input request
    var validations = [
        check("request_id")
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('employee_id')
            .trim().escape()
            .optional()
            .custom(async value => {
                if (value != null && value != '') {
                    let pattern = regexPatterns.uuidRegex;
                    if (pattern.test(value)) {
                        const employeeData = await indexService.find('employee', ['id', 'reference_id'], { id: value });
                        if (!employeeData.status) {
                            return Promise.reject(responseMessages.employee.employeeIdNotExists);
                        }
                    } else {
                        return Promise.reject(responseMessages.employee.employeeIdInvalid);

                    }
                }
            }),
    ];

    // Run the validation rules.
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);

    if (errors.isEmpty()) {

        let body = removeEmptyAndUndefinedKeys(req.body);

        /* Default Variable */
        let limit = (body.limit) ? (body.limit) : null;
        let page = (body.page) ? (body.page) : 1;
        let condition = {
            from_date: null,
            to_date: null
        };
        /* Default Variable */

        condition.employee_id = body.employee_id || null;
        condition.client_id = body.client_id || null;
        condition.reference_id = body.reference_id || null;
        condition.client_name = body.client_name || null;
        condition.employee_name = body.employee_name || null;
        condition.search = body.search ? body.search : null;
        body.status_type = (body.status_type == 'active_placements') ? 'ending_in_placements' : body.status_type;
        condition.status_type = (body.status_type && body.status_type != 'total_placements') ? body.status_type : null;
        if (body.from_date && body.to_date) {
            condition.from_date = moment(body.from_date, dateFormat).format('YYYY-MM-DD');
            condition.to_date = moment(body.to_date, dateFormat).format('YYYY-MM-DD');
        }

        /* Writing validation rules to the input request */
        var exportData = await placementExportServices.exportPlacementInfo(condition, dateFormat, page, limit);       
        if (!exportData.status) {
            responseData = { statusCode: responseCodes.codeInternalError, error: exportData.error, message: responseMessages.common.noRecordFound }
        } else {
            responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, path: exportData.filepath };
        }
    } else {
        throw new InvalidRequestError(responseMessages.common.requestIdRequired);
    }
    /* Writing validation rules to the input request */


    /* Log Response */
    logResponse('info', req, responseData, "Getting placemets complete Details Response");
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
}
);


module.exports = { placementExport }