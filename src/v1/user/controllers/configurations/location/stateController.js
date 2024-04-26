const { check, validationResult } = require('express-validator');
const { responseMessages } = require('../../../../../../constants/responseMessage');
const { responseCodes } = require('../../../../../../constants/responseCodes');
const stateService = require('../../../services/configurations/location/stateService');
const { logRequest, logResponse } = require('../../../../../../utils/log');
const indexServices = require('../../../services/index');
const { responseHandler } = require('../../../../../responseHandler');
const { tryCatch } = require('../../../../../../utils/tryCatch');
const InvalidRequestError = require('../../../../../../error/InvalidRequestError');
const { pagination } = require('../../../../../../config/pagination');

/**
 * State dropdown request to fetch state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + country_id(query) is mandatory, it should be a integer and checked if it exists in 'countries' table.
 *    + search(query) is not mandatory, it should be a string.

 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to fetch the country information.
 *    ~ Call the service function(find) to fetch the data and send the condition(defined above).
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
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {JSON} - Json Response
 * @throws {InvalidRequestError} - If the requestId or country_id is missing or empty.
 */
const dropdown = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting state Details request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  const countryId = req.query.country_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    if (countryId !== undefined && countryId !== '') {
      /* Default variable */
      const search = req.query.search ? req.query.search : '';
      /* Default variable */

      /* Writing validation rules to the input request */
      const condition = { search, is_active: true, country_id: countryId };

      /**
       * Retrieves state data from the index service based on the given condition.
       */
      const stateData = await indexServices.find('states', ['id', 'name as value'], condition, 0, [], null, 'name', 'ASC');
      if (!stateData.status) {
        responseData = { statusCode: responseCodes.codeSuccess, message: stateData.message, error: stateData.error, data: [] };
      } else {
        responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: stateData.data };
      }
      /* Writing validation rules to the input request */

      /* Log Response */
      logResponse('info', req, responseData, 'Getting state Details Response');
      /* Log Response */

      /* Return the response */
      responseHandler(res, responseData);
      /* Return the response */
    } else {
      throw new InvalidRequestError(responseMessages.configurations.state.countryId);
    }
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * State destroy request to delete state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ delete the details in 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'states' table.
 *     - check if the state is being used for organization in 'organization_contact_information' table.
 *     - check if the state is being used for any client in 'client_address' table.
 *     - check if the state is being used for any end client in 'end_clients' table.
 *     - check if the state is being used for any employee in 'employee_address_details' table.
 *     - check if the state is being used for any employee in 'employee_education_details' table.
 *     - check if the state is being used for any vendor in 'vendor_addresses' table.
 *     - check if the state is being used for any immigration in 'immigration_mapped_addresses' table.
 *    - check if the state is being used for any employee in 'employee' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the state information.
 *      ~ Call the service function(destroy) to delete the data and send request body to the store function.
 *        # Add the service function(destroy) return data to response.
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
 * @returns {JSON} - Json Response
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const destroy = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Delete state request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.stateIdRequired)
      .isInt().withMessage(responseMessages.configurations.state.stateIdInvalid)
      .custom((value) => {
        return indexServices.find('states', ['id', 'name', 'is_editable'], { id: value }).then((state) => {
          const stateData = state.status;
          if (!stateData) {
            return Promise.reject(responseMessages.configurations.state.IdNotExists);
          }
          if (!state.data[0].is_editable) {
            return Promise.reject(responseMessages.configurations.state.notAllowToModify);
          }
          req.body.name = state.data[0].name
        })
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('organization_contact_information', { state_id: Number(req.params.id) }, [], true).then((state) => {
            if (Number(state.data != 0)) {
              return Promise.reject("state is mapped for" + " " + state.data + " " + "organization contact information ");
            }
          })
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('client_address', { state_id: Number(req.params.id) }).then((clientAdd) => {
            if (Number(clientAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + clientAdd.data + " " + "client address ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('end_clients', { state_id: Number(req.params.id) }, [], true).then((endClient) => {
            if (Number(endClient.data) != 0) {
              return Promise.reject("state is mapped for" + " " + endClient.data + " " + "end clients ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_address_details', { state_id: Number(req.params.id) }, [], true).then((empAdd) => {
            if (Number(empAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empAdd.data + " " + "employee address details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_education_details', { state_id: Number(req.params.id) }, [], true).then((empedu) => {
            if (Number(empedu.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empedu.data + " " + "employee education details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('vendor_address', { state_id: Number(req.params.id) }, [], true).then((venAdd) => {
            if (Number(venAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + venAdd.data + " " + "vendor address ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('placements', { work_location_state_id: Number(req.params.id) }, [], true).then((placement) => {
            if (Number(placement.data) != 0) {
              return Promise.reject("state is mapped for" + " " + placement.data + " " + "placements ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('emergency_contact_information', { state_id: Number(req.params.id) }, [], true).then((emcoin) => {
            if (Number(emcoin.data) != 0) {
              return Promise.reject("state is mapped for" + " " + emcoin.data + " " + "emergency contact information ");
            }
          });
        }
        return true
      })
  ];
  /* Writing validation conditions to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   * + Delete  state details in the table.
   * If Validation Fails
   * + Throws an InvalidRequestError with the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id }
    await stateService.destroy(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.deletedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Delete state Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * State listing request to fetch state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *     ~ Fetch the data from 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(query) is mandatory.
 *    + limit(query) is not mandatory, it should be a integer.
 *    + page(query) is not mandatory, it should be a integer.
 *    + search(query) is mandatory, it should be a string.
 *   
 *  - Run the validation rules
 *    + If validation success
 *   ~ Define condition object to fetch the state information.
 *      ~ Call the service function(listing) to fetch the data and send the condition(defined above), limit, page
 *        # Add the service function(listing) return data to response.
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
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If the requestId is not provided.
 */
const listing = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'Getting state listing Details request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  const requestId = req.query.request_id;
  /* Default variable */

  if (requestId !== undefined && requestId !== '') {
    /* Default variable */
    const limit = (req.query.limit) ? (req.query.limit) : pagination.limit;
    const page = (req.query.page) ? (req.query.page) : pagination.page;
    const search = req.query.search ? req.query.search : '';
    /* Default variable */

    /* Writing validation rules to the input request */
    const condition = { search };
    /**
     * Retrieves a list of state data based on the given condition, page, and limit.
     */
    const stateData = await stateService.listing(condition, page, limit);
    if (!stateData.status) {
      responseData = { statusCode: responseCodes.codeSuccess, message: stateData.message, error: stateData.error, data: [] };
    } else {
      responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.success, data: stateData.data, activity: stateData.activity, pagination: stateData.pagination_data };
    }

    /* Log Response */
    logResponse('info', req, responseData, 'Getting state listing Details Response');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(responseMessages.common.requestIdRequired);
  }
});

/**
 * State Store request to store state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ Store the details in 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + country_id(body) is mandatory, it should be an integer and its existence is checked in 'countries' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'states' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean.
 *  - Run the validation rules
 *    + If validation success
 *      ~ Call the service function(store) to store the data and send request body to the store function.
 *        # Add the service function(store) return data to response.
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
 * @returns {JSON} Json
 * @throws {InvalidRequestError} - If there are validation errors.
 */
const store = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'New state creation request');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('country_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.state.countryId)
      .isInt().withMessage(responseMessages.configurations.state.countryIdInvalid)
      .custom((value) => {
        return indexServices.find('countries', ['id', 'name'], { id: value, is_active: true }).then((countryData) => {
          const status = countryData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.country.IdNotExists);
          }
        })
      }),
    check('name')
      .trim()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.stateNameRequired)
      .not().matches(/[{}?!'~$%*><]/)
      .withMessage(responseMessages.configurations.state.stateNameInvalid)
      .custom((value) => {
        return indexServices.find('states', ['id', 'name'], { name: value }).then((state) => {
          const stateData = state.status;
          if (stateData) {
            return Promise.reject(
              responseMessages.configurations.state.stateNameExists,
            );
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.state.statusRequired)
      .isBoolean().withMessage(responseMessages.configurations.state.statusInvalid)
  ];
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + Call the createstate service function
   *        - Based on the status in createstate function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Throws an InvalidRequestError with the error message.
   */
  if (errors.isEmpty()) {
    await stateService.store(req.body);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.addedSuccessfully,
    };
    /* Log Response */
    logResponse(
      'info',
      req,
      responseData,
      'New state  creation response',
    );
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(
      errors.array()[0].msg,
      responseCodes.codeUnprocessableEntity,
    );
  }
});

/**
 * State update request to update state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'states' table.
 *    + country_id(body) is mandatory, it should be a integer and checked for its existence in 'countries' table.
 *    + name(body) is mandatory, it should not contain certain special characters and its existence is checked in 'states' table to avoid duplicates.
 *    + is_active(body) is mandatory and should be a boolean and if is_active in the request is false .
 *     - check if the state is being used for organization in 'organization_contact_information' table.
 *     - check if the state is being used for any client in 'client_address' table.
 *     - check if the state is being used for any end client in 'end_clients' table.
 *     - check if the state is being used for any employee in 'employee_address_details' table.
 *     - check if the state is being used for any employee in 'employee_education_details' table.
 *     - check if the state is being used for any vendor in 'vendor_addresses' table.
 *     - check if the state is being used for any immigration in 'immigration_mapped_addresses' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the state information.
 *    ~ Call the service function(update) to update the data and send request body and condition in params to the update function.
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
 * @returns {JSOn} Json
 * @throws {InvalidRequestError} - If there are validation errors in the request.
 */
const update = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update state request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.stateIdRequired)
      .isInt().withMessage(responseMessages.configurations.state.stateIdInvalid)
      .custom((value) => {
        return indexServices.find('states', ['id', 'name'], { id: value, is_active: true }).then((state) => {
          const stateData = state.status;
          if (!stateData) {
            return Promise.reject(responseMessages.configurations.state.IdNotExists);
          }
        });
      }),
    check('country_id')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.state.countryId)
      .isInt().withMessage(responseMessages.configurations.state.countryIdInvalid)
      .custom((value) => {
        return indexServices.find('countries', ['id', 'name'], { id: value, is_active: true }).then((countryData) => {
          const status = countryData.status;
          if (!status) {
            return Promise.reject(responseMessages.configurations.country.IdNotExists);
          }
        });
      }),
    check('name')
      .trim()
      .notEmpty().withMessage(responseMessages.configurations.state.stateNameRequired)
      .not().matches(/[{}?!'~$%*><]/).withMessage(responseMessages.configurations.state.stateNameInvalid)
      .custom((value) => {
        return indexServices.find('states', ['id', 'name'], { name: value }).then((state) => {
          const status = state.status;
          if (status) {
            if (state.data[0].id !== req.params.id) {
              return Promise.reject(responseMessages.configurations.state.stateNameExists);
            }
          }
        });
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty().withMessage(responseMessages.configurations.state.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.state.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('organization_contact_information', { state_id: Number(req.params.id) }, [], true).then((state) => {
            if (Number(state.data != 0)) {
              return Promise.reject("state is mapped for" + " " + state.data + " " + "organization contact information ");
            }
          })
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('client_address', { state_id: Number(req.params.id) }).then((clientAdd) => {
            if (Number(clientAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + clientAdd.data + " " + "client address ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('end_clients', { state_id: Number(req.params.id) }, [], true).then((endClient) => {
            if (Number(endClient.data) != 0) {
              return Promise.reject("state is mapped for" + " " + endClient.data + " " + "end clients ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_address_details', { state_id: Number(req.params.id) }, [], true).then((empAdd) => {
            if (Number(empAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empAdd.data + " " + "employee address details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_education_details', { state_id: Number(req.params.id) }, [], true).then((empedu) => {
            if (Number(empedu.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empedu.data + " " + "employee education details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('vendor_address', { state_id: Number(req.params.id) }, [], true).then((venAdd) => {
            if (Number(venAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + venAdd.data + " " + "vendor address ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('immigration_mapped_addresses', { state_id: Number(req.params.id) }, [], true).then((immaad) => {
            if (Number(immaad.data) != 0) {
              return Promise.reject("state is mapped for" + " " + immaad.data + " " + "immigration mapped address ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('placements', { work_location_state_id: Number(req.params.id) }, [], true).then((placement) => {
            if (Number(placement.data) != 0) {
              return Promise.reject("state is mapped for" + " " + placement.data + " " + "placements ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('emergency_contact_information', { state_id: Number(req.params.id) }, [], true).then((emcoin) => {
            if (Number(emcoin.data) != 0) {
              return Promise.reject("state is mapped for" + " " + emcoin.data + " " + "emergency contact information ");
            }
          });
        }
        return true
      })
  ];
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *        - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Throws an InvalidRequestError with the error message.
  */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await stateService.update(req.body, condition);
    responseData = { statusCode: responseCodes.codeSuccess, message: responseMessages.common.updatedSuccessfully };

    /* Log Response */
    logResponse('info', req, responseData, 'Update state Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});

/**
 * State update-status request to update state data.
 * Overview of API:
 *  - Validate the request.
 *    + If success
 *      ~ Call the service function.
 *      ~ update the details in 'states' table and return the data
 *      ~ Add Success to the response
 *    + Else
 *      ~ add error validation to the response
 *  - Return the response
 * 
 * Logic : 
 *  - Logging incoming request
 *  - Define the validation rules as follows
 *    + request_id(body) is mandatory.
 *    + id(params) is mandatory, it should be a integer and checked for its existence in 'states' table.
 *    + is_active(body) is mandatory and should be a boolean and if is_active in the request is false .
 *     - check if the state is being used for organization in 'organization_contact_information' table.
 *     - check if the state is being used for any client in 'client_address' table.
 *     - check if the state is being used for any end client in 'end_clients' table.
 *     - check if the state is being used for any employee in 'employee_address_details' table.
 *     - check if the state is being used for any employee in 'employee_education_details' table.
 *     - check if the state is being used for any vendor in 'vendor_addresses' table.
 *  - check if the state is being used for any immigration in 'immigration_mapped_addresses' table.
 *  - Run the validation rules
 *    + If validation success
 *    ~ Define condition object to update the state information.
 *    ~ Call the service function(update) to update the data and send request body and condition in params to the update function.
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
 * @returns {JSOn} Json
 * @throws {InvalidRequestError} If there are validation errors in the request.
 */
const updateStatus = tryCatch(async (req, res) => {
  /* Log Request */
  logRequest('info', req, 'update status state request.');
  /* Log Request */

  /* Default variable */
  let responseData = [];
  /* Default variable */

  /* Writing validation rules to the input request */
  const validations = [
    check('request_id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.common.requestIdRequired),
    check('id')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.IdRequired)
      .isInt().withMessage(responseMessages.configurations.state.IdInvalid)
      .custom(async (value) => {
        const state = await indexServices.find('states', ['id', 'is_editable'], { id: value });
        const stateData = state.status;
        if (!stateData) {
          return Promise.reject(responseMessages.configurations.state.IdNotExists);
        }
        if (!state.data[0].is_editable) {
          return Promise.reject(responseMessages.configurations.state.notAllowToModify);
        }
      }),
    check('is_active')
      .trim()
      .escape()
      .notEmpty()
      .withMessage(responseMessages.configurations.state.statusRequired)
      .isBoolean()
      .withMessage(responseMessages.configurations.state.statusInvalid)
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('organization_contact_information', { state_id: Number(req.params.id) }, [], true).then((state) => {
            if (Number(state.data != 0)) {
              return Promise.reject("state is mapped for" + " " + state.data + " " + "organization contact information ");
            }
          })
        }
        return true
      })
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('client_address', { state_id: Number(req.params.id) }).then((clientAdd) => {
      //       if (Number(clientAdd.data) != 0) {
      //         return Promise.reject("state is mapped for" + " " + clientAdd.data + " " + "client address ");
      //       }
      //     });
      //   }
      //   return true
      // })
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('end_clients', { state_id: Number(req.params.id) }, [], true).then((endClient) => {
      //       if (Number(endClient.data) != 0) {
      //         return Promise.reject("state is mapped for" + " " + endClient.data + " " + "end clients ");
      //       }
      //     });
      //   }
      //   return true
      // })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_address_details', { state_id: Number(req.params.id) }, [], true).then((empAdd) => {
            if (Number(empAdd.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empAdd.data + " " + "employee address details ");
            }
          });
        }
        return true
      })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('employee_education_details', { state_id: Number(req.params.id) }, [], true).then((empedu) => {
            if (Number(empedu.data) != 0) {
              return Promise.reject("state is mapped for" + " " + empedu.data + " " + "employee education details ");
            }
          });
        }
        return true
      })
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('vendor_address', { state_id: Number(req.params.id) }, [], true).then((venAdd) => {
      //       if (Number(venAdd.data) != 0) {
      //         return Promise.reject("state is mapped for" + " " + venAdd.data + " " + "vendor address ");
      //       }
      //     });
      //   }
      //   return true
      // })
      // .custom((value) => {
      //   if (value == 'false' || Number(value) == 0) {
      //     return indexServices.count('placements', { work_location_state_id: Number(req.params.id) }, [], true).then((placement) => {
      //       if (Number(placement.data) != 0) {
      //         return Promise.reject("state is mapped for" + " " + placement.data + " " + "placements ");
      //       }
      //     });
      //   }
      //   return true
      // })
      .custom((value) => {
        if (value == 'false' || Number(value) == 0) {
          return indexServices.count('emergency_contact_information', { state_id: Number(req.params.id) }, [], true).then((emcoin) => {
            if (Number(emcoin.data) != 0) {
              return Promise.reject("state is mapped for" + " " + emcoin.data + " " + "emergency contact information ");
            }
          });
        }
        return true
      })
  ];
  /* Writing validation rules to the input request */

  /* Run the validation rules. */
  for (const validation of validations) {
    const result = await validation.run(req);
    if (result.errors.length) break;
  }
  const errors = validationResult(req);
  /* Run the validation rules. */

  /**
   * If validation is success
   *    + call the update service function
   *     - Based on the status in update function response, segregate the response and prepare the response
   * If Validation Fails
   *    + Return the error message.
   */
  if (errors.isEmpty()) {
    let condition = { id: req.params.id } // condition
    await stateService.updateStatus(req.body, condition);
    responseData = {
      statusCode: responseCodes.codeSuccess,
      message: responseMessages.common.updatedSuccessfully,
    };

    /* Log Response */
    logResponse('info', req, responseData, 'Update status state Response.');
    /* Log Response */

    /* Return the response */
    responseHandler(res, responseData);
    /* Return the response */
  } else {
    throw new InvalidRequestError(errors.array()[0].msg, responseCodes.codeUnprocessableEntity);
  }
});


module.exports = { destroy, dropdown, listing, store, update, updateStatus };
