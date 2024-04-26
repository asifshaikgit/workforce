const { tryCatch } = require('../../../../../utils/tryCatch')
const { logRequest, logResponse } = require('../../../../../utils/log')
const { responseMessages } = require('../../../../../constants/responseMessage')
const { responseCodes } = require('../../../../../constants/responseCodes')
const { responseHandler } = require('../../../../responseHandler')
const { check, validationResult } = require('express-validator');
const InvalidRequestError = require("../../../../../error/InvalidRequestError")
const templateServices = require('../../services/template/templateService')
const indexServices = require('../../services/index');
const { regexPatterns } = require('../../../../../constants/regexPatterns')

/**
 * Templates update request to update templates data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'mail_template' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + slug(body) is mandatory and checked for its existence in 'mail_template' table.
 *    + name(body) is mandatory, it should have only alphabets and numbers.
 *    + description(body) is mandatory, it should have only alphabets.
 *    + subject(body) is mandatory.
 *    + template(body) is mandatory.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Call the service function(update) to update the data and send request body in params to the update function.
 *        # Add the service function(update) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} If there are validation errors in the request data.
 */
const update = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, "update template request.");
    /* Log Request */

    /* Default Variable */
    var responseData = '';
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('slug').trim().escape().notEmpty().withMessage(responseMessages.configurations.template.slugNameRequired)
            .custom(async value => {
                const templateData = await indexServices.find('mail_template', ['id'], { slug: value }, null, [], null, null, null, false)
                var status = templateData.status
                if (!status) {
                    return Promise.reject(responseMessages.configurations.template.slugNameNotExists)
                }
            }),
        // check('name')
        //     .trim()
        //     .notEmpty().withMessage(responseMessages.configurations.template.templateNameRequired)
        //     .matches(regexPatterns.alphanumericSpaceRegex).withMessage(responseMessages.configurations.template.templateNameInvalid),
        // check('description')
        //     .trim()
        //     .matches(regexPatterns.alphaCharactersAndSpacesOnly)
        //     .withMessage(responseMessages.configurations.template.descriptionRequired),
        check('subject')
            .trim()
            .notEmpty().withMessage(responseMessages.configurations.template.subjectRequired),
        check('template')
            .trim()
            .notEmpty().withMessage(responseMessages.configurations.template.templateRequired)
    ];
    /* Writing validation rules to the input request */

    /*Run the validation rules. */
    for (var validation of validations) {
        var result = await validation.run(req);
        if (result.errors.length) break;
    }
    var errors = validationResult(req);
    /*Run the validation rules. */

    /**
     * If validation is success
     *    + call the update service function
     *        - Based on the status in update function response, segregate the response and prepare the response
     * If Validation Fails
     *    + Return the error message.
    */
    if (errors.isEmpty()) {
        const condition = { slug: req.body.slug }; // condition
        await templateServices.update(req.body, condition);
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully }

        /* Log Response */
        logResponse("info", req, responseData, "Update template Response.");
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData);
        /* Return the response */

    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
});

/**
 * Templates index request to fetch templates data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'template_parameters' and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + module_slug(query) is mandatory, it should be a string and should exist in 'template_parameters' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the templates information.
 *     ~ Call the service function(find) to fetch the data and send the condition(defined above).
 *        # Add the service function(find) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} If there are validation errors in the request.
 */
const listParam = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'get employee parameters Request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('module_slug')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.template.requiredSlug)
            .custom(async value => {
                const moduleSlugData = await indexServices.find('template_parameters', ['parameter'], { module_slug: value }, null, [], null, null, null, false)
                var status = moduleSlugData.status
                if (!status) {
                    return Promise.reject(responseMessages.template.invalidSlug)
                }
            }),
    ]
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    /**
     * If validation is success
     * +  employee  details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        var condition = { module_slug: req.query.module_slug }
        var paramData = await templateServices.find(condition);
        if (paramData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: paramData.data
            }

        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: []
            }

        }

        /* Log Response */
        logResponse('info', req, responseData, 'get employee parameters Response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity)
    }
}
);

/**
 * Templates dropdown request to fetch templates data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'mail_template' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the templates information.
 *    ~ Call the service function(findAll) to fetch the data.
 *        # Add the service function(findAll) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If the request parameters are invalid.
 */
const dropdown = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'get template parameters dropdown Request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
    ]
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    /**
     * If validation is success
     * +  employee  details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        var paramData = await templateServices.findAll()
        if (paramData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: paramData.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.noRecordFound,
                data: paramData.data
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'get employee parameters dropdown PResponse')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(
            errors.array()[0].msg,
            responseCodes.codeUnprocessableEntity
        )
    }
}
);

/**
 * Templates index request to fetch templates data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'mail_template' table and 'template_parameters' and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + module_slug(query) is mandatory, it should be a string and should exist in 'mail_template' table.
 *   
 *  - Run the validation rules
 *    + If validation success
 *     ~ Define condition object to fetch the templates information.
 *     ~ Call the service function(index) to fetch the data and send the condition(defined above).
 *        # Add the service function(index) return data to response.
 *    + Else
 *      ~ Add error validation to the response.
 *  - Prepare the response with status codes.
 *  - Logging the response
 *  - Return response using responseHandler()  
 *        
 * Notes :
 *    - Handling expection using try catch
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns None
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const index = tryCatch(async (req, res) => {
    /* Log Request */
    logRequest('info', req, 'get employee parameters index Request')
    /* Log Request */

    /* Default Variable */
    var responseData = ''
    /* Default Variable */

    /* Writing validation rules to the input request */
    var validations = [
        check('request_id')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.common.requestIdRequired),
        check('module_slug')
            .trim()
            .escape()
            .notEmpty()
            .withMessage(responseMessages.template.requiredSlug)
            .custom(async value => {
                const moduleSlugData = await indexServices.find('mail_template', ['id'], { slug: value }, null, [], null, null, null, false)
                var status = moduleSlugData.status
                if (!status) {
                    return Promise.reject(responseMessages.template.invalidSlug)
                }
            }),
    ]
    /* Writing validation conditions to the input request */

    /*Run the validation rules. */
    for (let validation of validations) {
        var result = await validation.run(req)
        if (result.errors.length) break
    }
    var errors = validationResult(req)
    /*Run the validation rules. */

    /**
     * If validation is success
     * +  employee  details in the collection.
     * If Validation Fails
     * + Return the error message.
     */
    if (errors.isEmpty()) {
        var condition = { slug: req.query.module_slug } // condition
        var paramData = await templateServices.index(condition)
        if (paramData.status) {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: paramData.data
            }
        } else {
            responseData = {
                statusCode: responseCodes.codeSuccess,
                message: responseMessages.common.success,
                data: responseMessages.common.noRecordFound
            }
        }

        /* Log Response */
        logResponse('info', req, responseData, 'get employee parameters index Response')
        /* Log Response */

        /* Return the response */
        responseHandler(res, responseData)
        /* Return the response */
    } else {
        throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
    }
}
);

module.exports = { listParam, update, dropdown, index }