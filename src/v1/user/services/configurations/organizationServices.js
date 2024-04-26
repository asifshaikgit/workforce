const indexRepository = require('../../repositories/index');
const path = require('path');
const fs = require('fs');
const UnExpectedError = require('../../../../../error/UnExpectedError');
const config = require('../../../../../config/app');
const { event } = require('../../../../../events/configurationActivityEvent');

/**
 * Function to fetch the organization data.
 * 
 * Logic : 
 *  - Fetch the data from the organization table using condition(param) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response with status as false 
 * 
 * @param {any} condition - The condition to filter the organization data.
 * @returns {Promise<{status: boolean, data: any[]}>} - A promise that resolves to an object
 * containing the status and data of the retrieved organization data. If the status is true,
 * the data will contain an array of organization objects. If the status is false, the data
 * will contain an error message.
*/
const index = async (condition) => {
  /**
    * Calls an `indexRepository.find` function with 'organization' as the table name, ['*'] to select all columns, and the provided 'condition'.
   */
  const joins = [
    { table: 'employee', condition: ['employee.id', 'organization.updated_by'], type: 'left' },
  ];
  const organization = await indexRepository.find('organization', ['organization.*', 'employee.display_name'], null, 5, joins);
  if (organization.status) {
    /* variables */
    const responseData = [];
    const totalDetails = organization.data;
    /* variables */

    /* Iterates over an array of 'totalDetails' and creates a new object for each item with selected properties. The new objects are then pushed into the 'responseData' array. */
    for (const item of totalDetails) {
      /** Create a new object 'listingObject' for each 'item' in 'totalDetails'. */
      const listingObject = {
        id: item.id,
        organization_name: item.organization_name,
        address_line_1: item.address_line_1,
        address_line_2: item.address_line_2,
        city: item.city,
        zip_code: item.zip_code,
        contact_number: item.contact_number ? item.contact_number : '',
        mobile_number: item.mobile_number ? item.mobile_number : '',
        date_format: item.date_format ? item.date_format : '',
        currency_symbol: item.currency_symbol ? item.currency_symbol : '',
        phone_number: item.phone_number ? item.phone_number : '',
        organization_fax_number: item.organization_fax_number ? item.organization_fax_number : '',
        website_url: item.website_url ? item.website_url : '',
        payable_to: item.payable_to ? item.payable_to : '',
        additional_information: item.additional_information ? item.additional_information : '',
        email_id: item.email_id,
        ext: item.ext ? item.ext : '',
        logo_name: item.logo_url ? item.logo_url.split('/').pop() : '',
        logo_url: item.logo_url ? item.logo_url : '',
        associated_app_names: item.associated_app_names ? item.associated_app_names : '',
        notify_university_usics: item.notify_university_usics ? item.notify_university_usics : false,
        enable_delete_email: item.enable_delete_email ? item.enable_delete_email : false,
        enable_settlement_amount: item.enable_settlement_amount ? item.enable_settlement_amount : false,
        created_by: item.created_by ? item.created_by : 'System',
        updated_by : item.display_name ? item.display_name : 'System'
      };

      /**Push the 'listingObject' into the 'responseData' array. */
      responseData.push(listingObject);
    }
    /**Return an object with 'status' set to true and 'data' containing the 'responseData' array. */
    return { status: true, data: responseData };
  } else {
    /** If the 'organization' status is not true, return the 'organization' object. */
    return organization;
  }
};

/**
 * Handles the saving or updating of organization data based on the received request.
 * - Reads and processes organization information and associated documents.
 * - Validates and handles cases for both new organization creation and existing organization updates.
 * - Manages the storage of organization data and associated documents.
 * - Emits activity events for logging and tracking changes.
 * - Returns the repository response containing the outcome of the operation.
 *
 * @param {Object} req - Express request object containing necessary details.
 * @param {Object} body - Body object containing organization data and related details.
 * @param {Object} condition - Condition object specifying the conditions for updating existing organization data.
 * @returns {Object} - Repository response containing the outcome of the operation.
 */
const saveOrUpdate = async (req, body, condition) => {
  const _pathSource = path.join(config.documentUploadPath, 'temp');
  const _pathDest = path.join(config.documentUploadPath, `${body.loginSubDomainName}`, 'documents', 'organization');
  const pathToUpload = `${body.loginSubDomainName}` + '/documents/organization';

  const organizationInfo = {
    first_name: body.first_name || null,
    middle_name: body?.middle_name || null,
    last_name: body.last_name || null,
    organization_name: body.organization_name,
    phone_number: body.phone_number,
    mobile_number: body.mobile_number,
    organization_fax_number: body.organization_fax_number,
    website_url: body.website_url,
    payable_to: body.payable_to,
    additional_information: body.additional_information,
    email_id: body.email_id,
    date_format: body.date_format,
    currency_symbol: body.currency_symbol,
    ext: body.ext || null,
    address_line_1: body?.address_line_1,
    address_line_2: body?.address_line_2 || null ,
    city: body?.city,
    zip_code: body?.zip_code,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };

  var documentData;
  var format;
  var file;
  var data;
  var fileData;
  var beforeUpdateData;

  if (body?.logo_id) {
    documentData = await indexRepository.find('temp_upload_documents', ['id', 'document_path'], { id: body?.logo_id }, null, [], null, null, null, false);
    format = path.extname(documentData.data[0].document_path);
    file = String(documentData.data[0].id + format);

    if (!fs.existsSync(_pathDest)) {
      fs.mkdirSync(_pathDest, { recursive: true });
    }

    data = fs.readFileSync(path.join(_pathSource, file));
    fs.writeFileSync(path.join(_pathDest, file), data);

    fileData = {
      ...organizationInfo,
      logo_url: `${config.documentUrl}/${pathToUpload}/${file}`,
    };
  }

  let repositoryResponse = [];

  if (req.params.id) {
    if (body.logo_id !== null && body.logo_id !== '') {
      beforeUpdateData = await getOrganizationData(condition);

      const fileData = {
        ...organizationInfo,
        logo_url: `${config.documentUrl}/${pathToUpload}/${file}`,
        updated_by: body.updated_by,
      };

      repositoryResponse = await indexRepository.update('organization', condition, fileData, null, ['date_format', 'currency_symbol']);
      await indexRepository.destroy('temp_upload_documents', { id: documentData.data[0].id });


    } else if (body.logo_id === null || body.logo_id === '') {

      beforeUpdateData = await getOrganizationData(condition);

      const updateData = {
        ...organizationInfo,
        updated_by: body.updated_by,
      }
      repositoryResponse = await indexRepository.update('organization', condition, updateData, null, ['date_format', 'currency_symbol']);
    }
    const afterUpdateData = await getOrganizationData(condition);

    const activity = {
      referrable_id: condition.id,
      referrable_type: 21,
      action_type: 2,
      created_by: body.created_by,
    };
    event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  } else {

    try {

      const storeData = {
        ...fileData,
        created_by: body.created_by,
      }

      repositoryResponse = await indexRepository.store('organization', storeData);
      await indexRepository.destroy('temp_upload_documents', { id: documentData.data[0].id });

      const activity = {
        referrable_id: repositoryResponse.data[0].id,
        referrable_type: 21,
        action_type: 1,
        created_by: body.created_by,
      };
      event.emit('configurationStoreActivity', { activity });
    } catch (err) {
      throw new UnExpectedError(`An error occurred while processing ${file}: ${err}`);
    }
  }

  return repositoryResponse;
};


/**
 * Retrieve  Organization data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch  Organization data from the 'organization' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Organization details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Organization details.
 */
const getOrganizationData = async (condition) => {
  const organizationData = await indexRepository.find('organization', ['*'], condition);
  const responseData = {
    'First Name': organizationData.data[0].first_name ? organizationData.data[0].first_name : '',
    'Middle Name': organizationData.data[0].middle_name ? organizationData.data[0].middle_name : '',
    'Last Name': organizationData.data[0].last_name ? organizationData.data[0].last_name : '',
    'Organization Name': organizationData.data[0].organization_name ? organizationData.data[0].organization_name : '',
    'Contact Number': organizationData.data[0].contact_number ? organizationData.data[0].contact_number : '',
    'Phone Number': organizationData.data[0].phone_number ? organizationData.data[0].phone_number : '',
    'Organization Fax Number': organizationData.data[0].organization_fax_number ? organizationData.data[0].organization_fax_number : '',
    'Website URL': organizationData.data[0].website_url ? organizationData.data[0].website_url : '',
    'Payable To': organizationData.data[0].payable_to ? organizationData.data[0].payable_to : '',
    'Additional Information': organizationData.data[0].additional_information ? organizationData.data[0].additional_information : '',
    'Email Id': organizationData.data[0].email_id ? organizationData.data[0].email_id : '',
    'Date Format': organizationData.data[0].date_format ? organizationData.data[0].date_format : '',
    'Currency Symbol': organizationData.data[0].currency_symbol ? organizationData.data[0].currency_symbol : '',
    'Invoice Theme': organizationData.data[0].invoice_theme ? organizationData.data[0].invoice_theme : '',
    'Email Signature': organizationData.data[0].email_signature ? organizationData.data[0].email_signature : '',
    'Ext': organizationData.data[0].ext ? organizationData.data[0].ext : '',
    'Associated App Names': organizationData.data[0].associated_app_names ? organizationData.data[0].associated_app_names : '',
    'Notify University USICS': organizationData.data[0].notify_university_usics ? organizationData.data[0].notify_university_usics : false,
    'Enable Delete Email': organizationData.data[0].enable_delete_email ? organizationData.data[0].enable_delete_email : false,
    'Enable Settlement Amount': organizationData.data[0].enable_settlement_amount ? organizationData.data[0].enable_settlement_amount : false,
    'Logo': organizationData.data[0].logo_url ? organizationData.data[0].logo_url : '',
    'Address Line 1': organizationData.data[0].address_line_1 ? organizationData.data[0].address_line_1 : '',
    'Address Line 2': organizationData.data[0].address_line_2 ? organizationData.data[0].address_line_2 : '',
    'Pincode': organizationData.data[0].zip_code ? organizationData.data[0].zip_code : '',
    'City': organizationData.data[0].city ? organizationData.data[0].city : '',
  };

  return responseData
};

/**
 * Updates the organization's invoice theme with the provided data.
 * 
 * Logic:
 *  - Define the condition object for the update.
 *  - Create the update entry object with the invoice theme ID, updated_by, and updated_at fields.
 *  - Call the update repository function to update the organization's invoice theme based on the condition((defined above)).
 *  - Create an 'activity' object to track the update of the organization.
 *  - Emit an event to log the activity, including details before and after the update.
 *  - Returns the response from the repository operation, indicating the success or failure
 * 
 * @param {any} body - The data containing the invoice theme ID, updated_by, etc.
 * @returns {Promise<any>} - A promise that resolves to the response from the update operation.
*/




const updateInvoiceTheme = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    invoice_theme: JSON.stringify(body.invoice_theme),
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching Organization details before update */
  const beforeUpdateData = await getOrganizationData(condition)
  /**Fetching Organization details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('organization', condition, updateData);

  /**Fetching organization details after update */
  const afterUpdateData = await getOrganizationData(condition)
  /**Fetching organization details after update */

  /**Actiivty track */
  const activity = {
    referrable_id: repositoryResponse.data[0].id,
    referrable_type: 21,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  return repositoryResponse;
};

const getInvoiceTheme = async (body, condition) => {

  let groupbyQuery = `SELECT invoice_theme FROM organization where id = ${body}`

  let data;
  data = await indexRepository.rawQuery(`${groupbyQuery}`);
  return data[0].invoice_theme;
};

/**
 * Update Email Signature for an Organization.
 * Logic: 
 *  - Create an update entry object with the new email signature, 'updated_by' information, and the current timestamp.
 *  - Call the update repository function to execute the update operation in the 'organization' table.
 *    - The 'email_signature' field is updated with the new email signature.
 *  - Create an 'activity' object to track the update of the organization.
 *  - Emit an event to log the activity, including details before and after the update.
 *  - Return the response from the repository function.
 *        
 * @param {Object} body - Request body containing the new email signature and metadata.
 * @returns {Object} Repository response indicating the success or failure of the update operation.
 */
const updateSignature = async (body, condition) => {
  // /* Writing condition to the update entry */
  // const condition = {};
  // /* Writing condition to the update entry */

  /* Creating update entry object */
  const updateData = {
    email_signature: body.signature,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching Organization details before update */
  const beforeUpdateData = await getOrganizationData(condition)
  /**Fetching Organization details before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('organization', condition, updateData, null, "email_signature");

  /**Fetching organization details after update */
  const afterUpdateData = await getOrganizationData(condition)
  /**Fetching organization details after update */

  /**Actiivty track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 21,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  return repositoryResponse;
};

/**
 * Retrieve Organization Profile Data.
 * 
 * Logic: 
 *  - Call the common 'find' function in the repository to retrieve organization data.
 *  - If the 'find' function's status is 'true' (indicating success):
 *    ~ Create a 'listingObject' containing the 'logo_url', ensuring it's an empty string if not provided.
 *    ~ Return a success status and the 'listingObject'.
 *  - Else 
 *    ~ return a status of 'false'.
 *        
 * @returns {Object} An object containing either organization profile data or a failure status.
 */
const profile = async () => {
  /**
    * Calling a  index function.
    * Based on the status in the function response, prepare the response and return to controller
   */
  const organization = await indexRepository.find('organization', ['logo_url']);
  if (organization.status) {
    /* variables */
    const responseData = organization.data[0];
    /* variables */

    const listingObject = {
      logo_url: responseData.logo_url ? responseData.logo_url : '',
    };

    return { status: true, data: listingObject };
  } else {
    return { status: false };
  }
};

/**
 * Retrieve Active Invoice Theme Data for an Organization.
 * 
 * Logic: 
 *  - Call the common to retrieve organization data.
 *  - If the 'find' function's status is 'true':
 *    ~ Extract 'invoice_theme_id' from the data and assign it to 'responseData'.
 *    ~ Create a 'listingObject' containing the 'invoice_theme_id', ensuring it defaults to '1' if not provided.
 *    ~ Return a success status and the 'listingObject'.
 *  - Else :
 *    ~ return a status of 'false' with an empty data array.
 *        
 * @returns {Object} An object containing either active invoice theme data or a failure status with an empty data array.
 */
const activeInvoiceTheme = async () => {
  /**
    * Calling a  index function.
    * Based on the status in the function response, prepare the response and return to controller
   */
  const organization = await indexRepository.find('organization', ['invoice_theme_id']);
  if (organization.status === true) {
    /* variables */
    const responseData = organization.data[0];
    /* variables */

    const listingObject = {
      invoice_theme_id: responseData.invoice_theme_id ? responseData.invoice_theme_id : '1',
    };

    return { status: true, data: listingObject };
  } else {
    return { status: false, data: [] };
  }
};

/**
 * Updates organization settings based on the provided body data and condition.
 * - Constructs an update entry object with the provided body data.
 * - Retrieves the state status before the update operation.
 * - Calls the update function in the repository with the provided condition and update data.
 * - Retrieves the state status after the update operation.
 * - Generates an activity track for the update operation.
 * - Returns the response from the repository update function.
 *
 * @param {Object} body - Object containing the updated organization settings.
 * @param {Object} condition - Condition to identify the organization settings to update.
 * @returns {Object} - Response from the repository update function.
 */
const updateOrganizationSettings = async (body, condition) => {

  /* Creating update entry object */
  const updateData = {
    associated_app_names: body.associated_app_names || null,
    notify_university_usics: body.notify_university_usics,
    enable_delete_email: body.enable_delete_email,
    enable_settlement_amount: body.enable_settlement_amount,
    updated_by: body.updated_by,
    updated_at: new Date(),
  };
  /* Creating update entry object */

  /**Fetching state status before update */
  const beforeUpdateData = await getOrganizationData(condition)
  /**Fetching state status before update */

  /**
   *  + Call the update repository function
   *    -Based on the status in update function response, segregate the response and prepare the response
   *
   */
  const repositoryResponse = await indexRepository.update('organization', condition, updateData);

  /**Fetching state status after update */
  const afterUpdateData = await getOrganizationData(condition)
  /**Fetching state status after update */

  /**Activity track */
  const activity = {
    referrable_id: condition.id,
    referrable_type: 35,
    action_type: 2,
    created_by: body.created_by,
  };
  event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  /**Activity track */

  return repositoryResponse;
};

module.exports = { index, saveOrUpdate, updateInvoiceTheme, updateSignature, profile, activeInvoiceTheme , updateOrganizationSettings, getInvoiceTheme };
