const indexRepository = require('../../repositories/index');
const { event } = require('../../../../../events/configurationActivityEvent');

/**
 * Store function to save organization contact information.
 * 
 * Logic:
 *  - Create an object 'contactData' with organization contact information.
 *  - Store 'contactData' in the 'organization_contact_information' table using common 'store' function.
 *  - Create an 'activity' object to track the store of the organization.
 *  - Emit an event to log the activity.
 *  - Return the result of the storage operation.
 * 
 * @param {object} body - The request body containing organization contact information.
 * @returns {Promise} A promise that resolves with the result of the storage operation.
 */
const store = async (body) => {
  /**StoreData Object */
  const contactData = {
    organization_name: body.organization_name,
    address_line_1: body.address_line_1,
    address_line_2: body.address_line_2,
    country_id: body.country_id,
    city: body.city,
    state_id: body.state_id,
    zip_code: body.zip_code,
    company_email_id: body.company_email_id,
    company_phone_number: body.company_phone_number,
    created_at: new Date(),
    created_by: body.created_by,
  };
  /**StoreData Object */

  const contactList = await indexRepository.store('organization_contact_information', contactData);

   /**Activty track */
   const activity = {
    referrable_id: contactList.data[0].id,
    referrable_type: 22,
    action_type: 1,
    created_by: body.created_by,
  };
  event.emit('configurationStoreActivity', {activity});
  /**Activty track */
  return contactList;
};

/**
 * Update Organization Contact Information in the Database.
 *  
 * Logic:
 *  - Define condition object to update using the 'organization_contact_information' table based on 'contact_id'(body)
 *  - Create 'updateData' object containing the updated organization contact information.
 *  - Retrieve the organization details before the update based on provided condition  ('beforeUpdateData').
 *  - Call the common 'update' repository function to update 'organization_contact_information' based on condition(defined above)
 *  - Retrieve the organization details after the update based on provided condition  ('afterUpdateData').
 *  - Create an 'activity' object to track the update of the organization.
 *  - Emit an event to log the activity, including details before and after the update.
 *  - Returns the response from the repository operation
 * 
 * @param {Object} body - The request body containing updated contact information.
 * @returns {Object} - Response from the update repository function.
 */
const update = async (body, condition) => {
  /* Creating update entry object */
  const updateData = { 
    organization_name: body.organization_name, 
    address_line_1: body.address_line_1, 
    address_line_2: body.address_line_2, 
    country_id: body.country_id, 
    city: body.city, 
    state_id: body.state_id, 
    zip_code: body.zip_code, 
    company_email_id: body.company_email_id, 
    company_phone_number: body.company_phone_number, 
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
  const repositoryResponse = await indexRepository.update('organization_contact_information', condition, updateData);

   /**Fetching organization details after update */
   const afterUpdateData = await getOrganizationData(condition)
   /**Fetching organization details after update */
 
   /**Actiivty track */
   const activity = {
     referrable_id: condition.id,
     referrable_type: 22,
     action_type: 2,
     created_by: body.created_by,
   };
   event.emit('configurationUpdateActivity', { activity, beforeUpdateData, afterUpdateData });
  return repositoryResponse;
};

/**
 * Retrieve  Organization data based on specified conditions.
 * 
 * Logic:
 * - Use the repository function to fetch  Organization data from the 'organization_contact_information' table based on the provided condition.
 * - Create a 'responseData' object with key-value pairs to represent the Organization details.
 * - Return 'responseData'.
 *    
 * @param {Object} condition - The conditions to filter Payment Modes.
 * @returns {Object} Response with Organization details.
 */
const getOrganizationData = async (condition) => {

  const fields = ['organization_contact_information.*', 'countries.name as country', 'states.name as state'];

  const joins = [
    { table: 'countries', condition: ['organization_contact_information.country_id', 'countries.id'], type: 'inner' },
    { table: 'states', condition: ['organization_contact_information.state_id', 'states.id'], type: 'inner' }
  ];
  const organizationData = await indexRepository.find('organization_contact_information', fields, {"organization_contact_information.id" : condition.id}, null, joins);
  const responseData = {
    'Organization Name': organizationData.data[0].organization_name ? organizationData.data[0].organization_name : '',
    'Address Line one': organizationData.data[0].address_line_1 ? organizationData.data[0].address_line_1 : '',
    'Address Line two': organizationData.data[0].address_line_2 ? organizationData.data[0].address_line_2 : '',
    'City': organizationData.data[0].city ? organizationData.data[0].city : '',
    'State': organizationData.data[0].state ? organizationData.data[0].state : '',
    'Country': organizationData.data[0].country ? organizationData.data[0].country : '',
    'Zip code': organizationData.data[0].zip_code ? organizationData.data[0].zip_code : '',
    'Company Phone Number': organizationData.data[0].company_phone_number ? organizationData.data[0].company_phone_number : '',
    'Company Email Id': organizationData.data[0].company_email_id ? organizationData.data[0].company_email_id : '',
    'Company Fax Number': organizationData.data[0].company_fax_number ? organizationData.data[0].company_fax_number : '',
    'Website Url': organizationData.data[0].website_url ? organizationData.data[0].website_url : '',
    'Payable To': organizationData.data[0].payable_to ? organizationData.data[0].payable_to : '',
    'Additional Information': organizationData.data[0].additional_information ? organizationData.data[0].additional_information : '',
  }
  return responseData
}

/**
 * Index function to retrieve contact information data for organizations.
 * 
 * Logic:
 *  - Define default variables for table name, fields, and joins.
 *  - Fetch the data from the organization_contact_information table using join the tables(defiend above) by calling common find function.
 *  - If data exists,
 *    + Prepare the response 
 *    + return the response with status as true
 *  - Else 
 *    + return the response 
 *        
 * @returns {Object} An object containing the status and retrieved contact information data.
 */
const index = async (condition) => {
  /* Default variables */
  const tableName = 'organization_contact_information';
  const fields = ['organization_contact_information.*', 'create.display_name as create_emp', 'update.display_name as updated_emp', 'countries.name as country_name', 'states.name as state_name'];
  const joins = [
    { table: 'employee as create', alias: 'create', condition: ['organization_contact_information.created_by', 'create.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'employee as update', alias: 'update', condition: ['organization_contact_information.updated_by', 'update.id'], type: 'left', ignoreDeletedAt: true },
    { table: 'countries', condition: ['organization_contact_information.country_id', 'countries.id'], type: 'left' },
    { table: 'states', condition: ['organization_contact_information.state_id', 'states.id'], type: 'left' },
  ];
  /* Default variables */
  const contact = await indexRepository.find(tableName, fields, {"organization_contact_information.id" : condition.id} , 0, joins);
  if (contact.status) {
    /* variables */
    const responseData = [];
    const totalDetails = contact.data;
    /* variables */

    // Iterates over an array of totalDetails and creates a new object for each item with selected properties. The new objects are then pushed into the responseData array.
    for (const item of totalDetails) {
      const listingObject = {
        id: item.id,
        organization_name: item.organization_name,
        address_line_1: item.address_line_1,
        address_line_2: item.address_line_2 !== null ? item.address_line_2 : '',
        country_id: item.country_id,
        country_name: item.country_name,
        city: item.city,
        state_id: item.state_id,
        state_name: item.state_name,
        zip_code: item.zip_code,
        company_email_id: item.company_email_id,
        company_phone_number: item.company_phone_number,
      };
      responseData.push(listingObject);
    }

    return { status: true, data: responseData };
  } else {
    return contact;
  }
};

module.exports = { index, store, update };
