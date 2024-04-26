
const updateSuperadminInformation = async (tenant, data, tenantData) => {

  let roleData = await tenant('roles').select('id').where('id', 1).first();
  let condition = { id : data[0].id };
    
  let updateData = {
    role_id: roleData.id,
  };

  const orgData = {
    first_name: tenantData.first_name || null,
    middle_name: tenantData?.middle_name || null,
    last_name: tenantData.last_name || null,
    organization_name: tenantData.organization_name,
    phone_number: tenantData.contact_number,
    organization_fax_number: tenantData.organization_fax_number,
    website_url: tenantData.website_url,
    payable_to: tenantData.payable_to,
    additional_information: tenantData.additional_information,
    email_id: tenantData.email_id,
    date_format: tenantData.date_format,
    currency_symbol: tenantData.currency_symbol,
    email_signature: `<p>Thanks &amp; Regards</p>\n<p>${tenantData.subdomain_name}</p>`,
    ext: tenantData.ext || null,
    created_at: new Date(),
  }

  await tenant('organization').insert(orgData);

  /**StoreData Object */
  const contactData = {
    organization_name: tenantData.organization_name,
    company_email_id: tenantData.personal_email_id,
    company_phone_number: tenantData.mobile_number,
    created_at: new Date()
  };
  /**StoreData Object */

  await tenant('organization_contact_information').insert(contactData);
  await tenant('employee').where(condition).update(updateData);
};

module.exports = updateSuperadminInformation;
