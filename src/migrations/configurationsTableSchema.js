const configrationsTableSchema = async (tenant) => {

  await tenant.schema

    /**
     * Defaults tables. These tables are created with seeders data that cannot be changed through application API's
     */
    .createTable('cycles', (table) => { // Table schema that stores cycles(Timesheet/Invoice) information of the organization
      table.increments();
      table.string('name', 30).index().notNullable().comment('name of the cycle');
      table.string('slug', 30).index().notNullable().comment('Slug of the cycle');
      table.string('description', 255).comment('description of the cycle');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry');
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('days', (table) => { // Table schema that stores days information of the organization i.e. Sunday to Saturday
      table.increments()
      table.string('name', 100).index().notNullable().comment('name of the day')
      table.string('slug', 30).index().notNullable().comment('Slug of the day')
      table.string('description', 255).comment('description of the day')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('modules', (table) => { // Table schema that stores module information of the organization
      table.increments();
      table.string('name', 100).index().notNullable().comment('Name of the module');
      table.string('description', 255).comment('description of the module');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('permissions', (table) => { // Table schema that store RBAC permissions information of the organization
      table.increments()
      table.integer('module_id').index().notNullable().comment('ID of the module')
      table.string('name', 100).index().notNullable().comment('Name of the permission')
      table.string('parent_slug', 100).defaultTo(null).comment('Parent Slug of the permission')
      table.string('slug', 100).index().notNullable().comment('Slug of the permission and must be unique');
      table.string('description', 255).comment('Description of the permission')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('prefixes', (table) => { // Table schema that store prefixes information of the organization
      table.increments();
      table.string('name', 50).index().notNullable().comment('name of prefix module');
      table.string('slug', 100).index().notNullable().comment('slug Name of the prefix module');
      table.string('prefix_name', 100).comment('Name of the prefix');
      table.string('separator', 10).comment('separator');
      table.integer('number').unsigned().comment('number series start from');
      table.string('description', 100).nullable().comment('Description of the prefix');
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Organization tables
     */
    .createTable('organization', (table) => { // table schema to store the organization information
      table.increments().comment('Primary key')
      table.string('organization_name', 30).comment('Name of the organization')
      table.string('logo_url', 255).comment('Organization logo link')
      table.string('first_name', 100).comment('Organization first name ')
      table.string('middle_name', 100).nullable().comment('Organization middle name')
      table.string('last_name', 100).comment('Organization last name')
      table.string('phone_number', 12).index().comment('Phone number')
      table.string('address_line_1', 255).comment('Address line 1')
      table.string('address_line_2', 255).comment('Address line 2')
      table.integer('state_id', 11).index().comment('State id')
      table.integer('country_id', 11).index().comment('Country id')
      table.string('city', 50).comment('City name')
      table.string('zip_code', 10).comment('zipcode of the entry')
      table.string('organization_fax_number', 255).comment('Organization fax_number')
      table.string('website_url', 255).comment('Website Url')
      table.string('payable_to', 255).comment('Payable To')
      table.string('additional_information', 255).comment('Extra information that can be added to the organization')
      table.string('email_id', 320).index().comment('Organization Email id')
      table.mediumint('ext').nullable().comment(' Email id')
      table.string('mobile_number', 12).index().comment('Organization mobile number')
      table.boolean('enable_taxes_for_invoices').defaultTo(false).comment('Enable and disable taxes for invoices')
      table.json('invoice_theme').comment('Invoice theme. These themes will be handled by FE team')
      table.string('email_signature').comment('Signature adds for every mail that sent by the application.')
      table.string('currency_symbol', 5).defaultTo('$').notNullable().comment('The currency symbol that will be used to display the value of the amount is: [currency symbol].')
      table.string('date_format', 20).defaultTo('MM/DD/YYYY').notNullable().comment('The date format used to format the dates for this organization is: [date format].')
      table.integer('invite_link_expiry').defaultTo('2').comment('Default Invite Link expiry Days for an organization.')
      table.string('associated_app_names').comment('names of the apps associated to off boarding')
      table.boolean('notify_university_usics').comment('to enable notifying the university or usics in off boarding')
      table.boolean('enable_delete_email').comment('to enable to delete the email')
      table.boolean('enable_settlement_amount').comment('to enable the settle amount')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('organization_contact_information', (table) => { // table schema to store the organization contact information, used in invoice/bills/payments 
      table.increments()
      table.string('organization_name', 150).comment('Name of the organization')
      table.string('address_line_1', 200).comment('Address line 1')
      table.string('address_line_2', 200).comment('Address line 2')
      table.integer('country_id', 11).index().comment('Country id')
      table.string('city', 50).comment('City name')
      table.integer('state_id', 11).index().comment('State id')
      table.string('zip_code', 10).comment('zipcode of the entry')
      table.string('company_email_id', 320).comment('Email ID')
      table.string('company_phone_number', 30).comment('Company phone number')
      table.string('company_fax_number', 30).comment('Company fax number')
      table.string('website_url', 255).comment('Website url of the organization')
      table.string('payable_to', 255).comment('Payable to the organization')
      table.string('additional_information', 255).comment('Extra information that can be added to the organization')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    .createTable('payroll_config_settings', (table) => { // Payroll auto generate table schema
      table.increments()
      table.string('name', 100).index().notNullable().comment('Name of Payroll config settings, must be unique')
      table.integer('payroll_cycle_id').index().notNullable().comment('Cycle id')
      table.date('from_date').comment('Payroll from date').notNullable()
      table.date('to_date').comment('Payroll to date').notNullable()
      table.date('check_date').index().comment('Payroll check date. The date, the payroll allows to run')
      table.date('actual_check_date').defaultTo(null).comment('Actual check date')
      table.date('second_from_date').defaultTo(null).comment('Second from date when cycle is semi monthly')
      table.date('second_to_date').defaultTo(null).comment('Second to date when cycle is semi monthly')
      table.date('second_check_date').defaultTo(null).comment('Second check date when cycle is semi monthly')
      table.date('second_actual_check_date').defaultTo(null).comment('Second actual check date when cycle is semi monthly')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    .createTable('payroll_configuration', (table) => { // Payroll dates table schema
      table.increments();
      table.integer('pay_config_setting_id').index().notNullable().comment('payroll config setting id relation')
      table.date('from_date').comment('Payroll from date')
      table.date('to_date').comment('Payroll to date')
      table.date('check_date').comment('The date this payroll allows to run')
      table.enu('status', ['Yet to generate', 'Drafted', 'Submitted', 'Skipped']).notNullable();
      table.boolean('is_adhoc').defaultTo(false).comment('To Create and run the Adhoc payrolls')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Employee Configuration tables
     */
    .createTable('employment_types', (table) => { // Employment type table schema
      table.increments()
      table.string('name', 100).index().notNullable().comment('Employment type Name')
      table.string('description', 255).comment('Employment type description')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('employee_categories', (table) => { // Employee categories table schema
      table.increments()
      table.integer('employment_type_id').index().notNullable().comment('Employement type id')
      table.string('name', 100).index().notNullable().comment('Category name')
      table.string('description', 255).comment('Description of employee category.')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('departments', (table) => { // Department table schema
      table.increments();
      table.string('name', 100).index().notNullable().comment('Department name')
      table.string('description', 255).comment('Description of the department name')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('teams', (table) => { // Team table schema
      table.increments();
      table.string('name', 100).index().notNullable().comment('Name of the team')
      table.integer('department_id').index().comment('Department ID (Parent ID)')
      table.string('description', 255).comment('description of the team name')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('document_categories', (table) => { // Document categories table schema. Personal and Placement documents store
      table.increments();
      table.string('name', 100).index().notNullable().comment('Name of document category.');
      table.string('slug', 100).index().notNullable().comment('An identifier for the document category');
      table.string('description', 255).comment('Description of the document category.').nullable();
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('document_types', (table) => { // Document types table schema that mapped to document categories
      table.increments();
      table.integer('document_category_id').index().notNullable().comment('Document Category (Parent ID).');
      table.string('name', 100).index().notNullable().comment('Name of the document type');
      table.string('description', 255).comment('description of the document type.');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.boolean('number_mandatory').defaultTo(false).comment('Document Number Mandatory Status');
      table.boolean('number_display').defaultTo(false).comment('Document Number Display Status');
      table.boolean('valid_from_mandatory').defaultTo(false).comment('Valid From Mandatory Status');
      table.boolean('valid_from_display').defaultTo(false).comment('Valid From Display Status');
      table.boolean('valid_to_mandatory').defaultTo(false).comment('Valid To Mandatory Status');
      table.boolean('valid_to_display').defaultTo(false).comment('Valid To Display Status');
      table.boolean('status_mandatory').defaultTo(false).comment('Status Mandatory Status');
      table.boolean('status_display').defaultTo(false).comment('Status Display Status');
      table.boolean('upload_mandatory').defaultTo(false).comment('Upload Mandatory Status');
      table.boolean('upload_display').defaultTo(false).comment('Upload Display Status');
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('skills', (table) => { // Skills table schema
      table.increments();
      table.string('name', 100).index().notNullable().comment('Skill name')
      table.string('description', 255).comment('Description of the Skill name')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('education_levels', (table) => { // Education Levels table schema
      table.increments();
      table.string('name', 100).index().notNullable().comment('Education name')
      table.string('description', 255).comment('Description of the Skill name')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('relationship_types', (table) => { // Relationship types table schema
      table.increments();
      table.string('name', 100).index().notNullable().comment('Skill name')
      table.string('description', 255).comment('Description of the Skill name')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('visa_types', (table) => {
      table.increments();
      table.string('name', 100).index().notNullable().comment('visa type');
      table.string('description', 255).comment('description of the visa type');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('visa_document_types', (table) => {
      table.increments();
      table.integer('visa_type_id').index().notNullable();
      table.string('name', 100).index().notNullable().comment('visa document name');
      table.string('description', 255).comment('description of the visa document type');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    /**
     * Location tables
     */
    .createTable('states', (table) => { // States table schema
      table.increments()
      table.string('name', 255).index().notNullable().notNullable()
      table.string('description', 255).comment('description of the state.')
      table.integer('country_id').index().unsigned().notNullable()
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('countries', (table) => { // Countries table schema
      table.increments()
      table.string('name', 100).index().notNullable().comment('name of the country.')
      table.string('description', 255).comment('description of the country.')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.string('country_flag_link').comment('image link of the coutry.')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Placement Configurations tables
     */
    .createTable('job_titles', (table) => {
      table.increments()
      table.string('name', 100).index().notNullable().comment('Name of the job titles')
      table.string('description', 255).comment('description of the job title')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Timesheet Configurations tables
     */
    .createTable('timesheet_configurations', (table) => {
      table.increments()
      table.integer('cycle_id').index().notNullable().comment('Time sheet cycle id')
      table.integer('day_start_id').index().comment('The day time sheet starts from - is applicable only for Weekly and Bi-weekly cycles')
      table.time('default_hours').comment('Default working hours')
      table.boolean('ts_mandatory').comment('true if Timesheet is mandatory')
      table.boolean('is_global').index().defaultTo(false).comment('True if it is a global configuration')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Invoice Configurations tables
     */
    .createTable('invoice_configurations', (table) => {
      table.increments()
      table.integer('cycle_id').index().notNullable().comment('Time sheet cycle id')
      table.integer('day_start_id').index().comment('The day time sheet starts from - is applicable only for Weekly and Bi-weekly cycles')
      table.boolean('is_global').index().defaultTo(false).comment('True if it is a global configuration')
      table.integer('net_pay_terms_id').comment('net pay terms id')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Invoice Email Template Configurations tables.
     */
    .createTable('invoice_email_templates', (table) => {
      table.increments()
      table.specificType('cc', 'character varying[]')
      table.specificType('bcc', 'character varying[]')
      table.text('subject').notNullable().comment('Subject of the email message')
      table.text('template').notNullable().comment('Template of the email message')
      table.boolean('is_global').index().defaultTo(false).comment('True if it is a global configuration')
      table.string('description').comment('description of the template')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * All Email Template Params tables
     */
    .createTable('template_parameters', (table) => {
      table.increments()
      table.string('module_slug').comment('Referrable name of the email template');
      table.string('parameter').comment('Parameter name that should be replaced while seding the email')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Common Emails templates that are specific to the entire organization
     */
    .createTable('mail_template', (table) => {
      table.increments().comment('id');
      table.string('slug').index().comment('An identifier for the email')
      table.string('name').notNullable().comment('Name of the email')
      table.text('subject').notNullable().comment('Subject of the email message')
      table.text('template').notNullable().comment('Template of the email message')
      table.string('description').comment('description of the template')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Approval Level configuration for Invoice and Timesheet.
     * 
     */
    .createTable('approval_settings', (table) => {
      table.increments()
      table.tinyint('approval_module').index().notNullable().comment('Type of approval configuration,1 for timesheet and 2 for invoice and 3 for employee self service')
      table.boolean('is_global').index().defaultTo(false).comment('true: Global Setting, false: Custom setting')
      table.tinyint('approval_count').unsigned().notNullable().comment('Count of approvals required for the setting')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('approval_levels', (table) => {
      table.increments()
      table.integer('approval_setting_id').index().notNullable().comment('Parent id; approval settings id')
      table.tinyint('level').unsigned().comment('Level of approval')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('approval_users', (table) => {
      table.increments()
      table.integer('approval_level_id').index().notNullable().comment('Parent id; approval levels id')
      table.uuid('approver_id').index().notNullable().comment('employee_id who are going to approve the raised request')
      table.uuid('created_by').comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Roles configuration
     */
    .createTable('roles', (table) => {
      table.increments()
      table.string('name', 100).index().notNullable().comment('role name')
      table.boolean('is_active').comment('to enable and disable the particular role')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry');
      table.string('description', 255).comment('description about the role')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('role_permissions', (table) => {
      table.increments()
      table.integer('role_id').index().notNullable().comment('role ID')
      table.integer('permission_id').index().notNullable().comment('permission ID')
      table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry')
      table.boolean('is_allowed').comment('Shall we allow for this permission')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })


    /**
     * Groups Configuration
     */
    .createTable('groups', (table) => {
      table.increments().comment('Group ID');
      table.string('name', 150).index().notNullable().comment('Name of the Group');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('notification_group_users', (table) => {
      table.increments().comment('ID of row');
      table.integer('referrable_type').index().notNullable().comment('1 for Group Users, 2 for Notification Users.');
      table.integer('referrable_id').index().notNullable().comment('ID of Group User or Notification User belongs to');
      table.uuid('employee_id').comment('employee ID in group');
      table.uuid('created_by').comment('record created employee id');
      table.uuid('updated_by').comment('record updated employee id');
    })

    /**
     * Invoice Configuration tables
     */
    .createTable('payment_modes', (table) => {
      table.increments();
      table.string('name', 100).index().notNullable().comment('name of the payment mode');
      table.string('description', 255).comment('description of the payment mode');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('write_off', (table) => {
      table.increments();
      table.string('write_off_reason', 100).comment('Name of the write-off');
      table.string('description', 255).comment('write off description');
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('invoice_taxes', (table) => {
      table.increments().comment('Document ID');
      table.string('name', 150).index().notNullable().comment('Name of the tax dediction');
      table.tinyint('type').comment('Type of tax deduction, 1 for Percentage 2 for Value');
      table.specificType('value','double precision').defaultTo(0.00).comment('Value of the tax that needs to add as a tax');
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Client Configuration table
     */
    .createTable('net_pay_terms', (table) => {
      table.increments()
      table.integer('days').index().notNullable().unsigned().comment('number of days for net pay terms')
      table.string('description', 255).comment('description of the net pay terms')
      table.boolean('is_active').index().defaultTo(true).comment('Set new entry as Active')
      table.boolean('is_editable').index().defaultTo(true).comment('Entry is allowed to be editable')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
     * Temporary store the tenant documents
     */
    .createTable('tenant_documents', (table) => {
      table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary().comment('document id');
      table.string('file_name');
      table.string('file_path');
      table.string('document_type_id');
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    /**
       * To track the Configuration changes
       */
    .createTable('configuration_activity_track', (table) => { // To track the configurations activity/changes
      table.increments()
      table.integer('referrable_id').index().notNullable().comment('configuration id')
      table.tinyint('referrable_type').index().comment('configuration id  1-employee category, 2-department, 3-educational level, 4-employee team, 5-relationship type, 6-skills, 7-visa type, 8-visa document type, 9-payment mode, 10-write off, 11-invoice taxes, 12-invoice configuration, 13-countries, 14-states, 15-job title, 16-timesheet configuration, 17- self service, 18- net pay terms, 19-document types, 20-aprroval configuration, 21-organization, 22-organization contacts, 23-payroll config setting, 24-prefix, 25-expense types, 26-roles, 27-reminders')
      table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable()
      table.jsonb('change_log').comment('Change Log of the activity')
      table.uuid('created_by').index().comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
    })

    .createTable('expense_and_service_types', (table) => {
      table.increments();
      table.integer('referrable_type').index().notNullable().comment('1 for Employee Self service Types, 2 for Expense Management Types.');
      table.string('name', 100).index().notNullable().comment('Name of the employee self service');
      table.string('description', 255).comment('description of the self service name');
      table.boolean('is_active');
      table.boolean('is_editable').comment('Allow user to edit this entry').defaultTo(true);
      table.uuid('created_by', 36).comment('record created employee id');
      table.uuid('updated_by', 36).comment('record updated employee id');
      table.timestamp('created_at').defaultTo(tenant.fn.now());
      table.timestamp('updated_at').defaultTo(null);
      table.timestamp('deleted_at').defaultTo(null).comment('record deleted time');
    })

    .createTable('assignee_employees', (table) => {
      table.increments();
      table.integer('referrable_type').index().notNullable().comment('1 for Self service Users, 2 for Expense Type Users.');
      table.integer('referrable_id').index().notNullable().comment('Self service type OR Expense Type ID');
      table.uuid('employee_id', 36).index().notNullable().comment('assigned employee id');
      table.uuid('created_by', 36).comment('record created employee id');
      table.uuid('updated_by', 36).comment('record updated employee id');
      table.timestamp('created_at').defaultTo(tenant.fn.now());
      table.timestamp('updated_at').defaultTo(null);
      table.timestamp('deleted_at').defaultTo(null).comment('record deleted time');
    })
    .createTable('notification_settings', (table) => {
      table.increments().comment('ID of setting');
      table.string('name').index().notNullable().comment('name of module for notification setting');
      table.string('slug').index().comment('slug name of module');
      table.text('template').comment('template');
      table.uuid('created_by', 36).comment('record created employee id');
      table.uuid('updated_by', 36).comment('record updated employee id');
      table.timestamp('created_at').defaultTo(tenant.fn.now());
      table.timestamp('updated_at').defaultTo(null);
      table.timestamp('deleted_at').defaultTo(null).comment('record deleted time');
    })
    .createTable('action_notification_config', // Action Notifications Config Schema
      (table) => {
        table.increments()
          .comment('Action Notification Config ID')
        table.string('slug', 50)
          .index()
          .notNullable()
          .comment('Slugs for actions and notifications timesheet-approved, invoice-approved, invoice-drafted, expense-received,payroll-drafted, consultatnt-invitation-submit, personal-documents-expiry,work-authorization-documents-expiry,invoice-due-date,bill-due-date, invoice-due-date,bill-due-date,birthdays, consultatnt-invitation-submit, placement-expiry,work-authorization-documents-expiry, personal-documents-expiry, expense-received, payroll-submit')
        table.boolean('status')
          .index()
          .defaultTo(true)
          .comment('Status of a action_notification_config - true, false')
        table.string('content', 255)
          .comment('Content of an action notification config')
        table.string('referrable_type', 20)
          .index()
          .notNullable()
          .comment('referrable_types - action, notification')
        table.string('name', 50)
          .index()
          .notNullable()
          .comment('Names - Action, Notification')
        table.specificType('group_ids', 'integer[]')
          .comment('Group Ids that to get notified for a specific action')
        table.uuid('created_by')
          .comment('Record created employee id')
        table.timestamp('created_at')
          .defaultTo(tenant.fn.now())
          .comment('Record Created timestamp')
        table.uuid('updated_by')
          .comment('Record updated employee id')
        table.timestamp('updated_at')
          .defaultTo(tenant.fn.now())
          .comment('Record updated timestamp')
        table.timestamp('deleted_at')
          .index()
          .defaultTo(null)
          .comment('Record deleted timestamp')
      })
    .createTable('onboarding_document_types', // Onboarding documents type table
      (table) => {
        table.increments()
          .comment('OnBoarding Document Type ID')
        table.string('name', 50)
          .index()
          .notNullable()
          .comment('Name of the document type Required at the time of on boarding')
        table.string('slug', 50)
          .index()
          .notNullable()
          .comment('Slug of the document type Required at the time of on boarding')
        table.boolean('is_editable')
          .index()
          .defaultTo(false)
          .comment('Is Editable - true, false: If false not to allow to change the name of document')
        table.string('description', 255)
          .comment('Description of document')
        table.boolean('is_mandatory')
          .index()
          .defaultTo(false)
          .comment('Is Mandatory - true, false')
        table.boolean('status')
          .index()
          .defaultTo(false)
          .comment('Status - true, false')
        table.uuid('created_by')
          .comment('Record created employee id')
        table.timestamp('created_at')
          .defaultTo(tenant.fn.now())
          .comment('Record Created timestamp')
        table.uuid('updated_by')
          .comment('Record updated employee id')
        table.timestamp('updated_at')
          .defaultTo(tenant.fn.now())
          .comment('Record updated timestamp')
        table.timestamp('deleted_at')
          .index().defaultTo(null)
          .comment('Record deleted timestamp')
      }
    )
    .createTable('reminder_configurations', (table) => {
      table.increments().comment('Reminder Configuration ID')
      table.string('slug').index().notNullable().comment('slug for reminders type')
      table.string('name').index().notNullable().comment('name of the remoinder type')
      table.string('referrable_type').index().notNullable().comment('reminders types')
      table.string('description', 255).comment('description of the reminder');
      table.uuid('created_by').comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('reminder_referrables', (table) => {
      table.increments().comment('Reminder Referrables ID')
      table.integer('reminder_name_id').comment('Reminder Configuration ID')
      // table.integer('referrable_id').comment('Id related to slug of reminder configurations')
      table.boolean('status').index().defaultTo(false).comment('true: active reminder_referrables, false: in-active reminder_referrables')
      table.string('content').comment('content of the reminder')
      table.specificType('group_ids', 'integer[]').comment('Group Ids that to get reminded for a specific action')
      table.specificType('employee_ids', 'UUID[]').comment('employee Ids that to get reminded for a specific action')
      table.date('reminder_date').comment('reminder date')
      table.time('reminder_time').comment('reminder time')
      table.boolean('is_payroll_reminder').defaultTo(false).comment('true: active payroll reminder, false: in-active payroll reminder')
      table.date('check_date').comment('check date')
      table.integer('pay_config_setting_id').comment('payroll config setting id relation')
      table.uuid('created_by').comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('reminder_occurances', (table) => {
      table.increments().comment('Reminder Occurances ID')
      table.integer('reminder_referrable_id').comment('Reminder Referrable ID')
      table.tinyint('occurance_order').comment('1-before, 2-after')
      table.integer('number').comment('')
      table.string('cycle', 15).comment('days, weeks, months')
      table.boolean('is_recurring').index().defaultTo(false).comment('')
      table.integer('recurring_days').comment('Recurring Days for recuuring of reminder')
      table.uuid('created_by').comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('reminder_documents', (table) => { // Self service documents
      table.increments().comment('Document ID');
      table.integer('reminder_name_id').comment('reminder name id').index().notNullable()
      table.string('document_name', 100).comment('reminder document name')
      table.tinyint('document_status').defaultTo(0).unsigned().notNullable().comment('0 - New, 1 - Rejected and 2 -Accepted')
      table.string('document_url').comment('reminder document url')
      table.string('document_path').comment('Path of the uploaded document')
      table.boolean('aws_s3_status').index().defaultTo(false).comment('AWS uploaded status')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    .createTable('announcements', (table) => { // Announcements Detail;s
      table.increments().comment('Announcement ID')
      table.tinyint('expression_type').index().notNullable().comment('1-Web, 2 - Mobile')
      table.string('document_name', 255).comment('name of the uploaded document')
      table.string('document_url').comment('Document URL path')
      table.string('aws_s3_key').comment('Path of the uploaded document')
      table.tinyint('aws_s3_status').defaultTo(0).comment('0 for New, 1 for Pushed to AWS, 2 for Error')
      table.date('publish_date').index().comment('Publish date')
      table.uuid('created_by').comment('Record created employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
  })
}

module.exports = configrationsTableSchema;
