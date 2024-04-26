const companiesTableSchema = async (tenant) => {
    /**
     * using entity type as a flag to manage the client, end-client and vendor information.
     */
    await tenant.schema
        .createTable('companies', (table) => { // Companies details table
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary().comment('Client ID')
            table.string('name', 100).comment('company name')
            table.string('entity_type').index().notNullable().comment('client, vendor, end-client')
            table.string('reference_id', 25).index().notNullable().comment('Random generated id')
            table.boolean('is_draft').comment('To Mark the entry as draft')
            table.specificType('available_balance','double precision').defaultTo(0.00).comment('Current available balance')
            table.boolean('is_active').index().defaultTo(true).comment('active status of company')
            // table.enu('status', ['Active', 'In Active']).comment('Companies status: Active, or In Active');
            table.enu('status', ['Active', 'In Active']).index().defaultTo('Active').notNullable().comment('Companies status: Active, or In Active');
            table.integer('net_pay_terms_id').index().comment('net pay terms of the company')
            table.integer('invoice_configuration_id').index().comment('Which invoice raise configurations this company should mapped with.')
            table.integer('invoice_approval_id').index().comment('Which invoice approval configurations this company should mapped with.')
            table.integer('timesheet_configuration_id').index().comment('Which timesheet raise configurations this company should mapped with.')
            table.integer('timesheet_approval_id').index().comment('Which timehsheet approval configurations this company should mapped with.')
            table.integer('invoice_email_template_id').comment('Email Template id that follow this company')
            table.tinyint('invoice_email_template_type').comment('Invoice email template setting type 1-global 2-custom')
            table.boolean('same_as_above').comment('same address for communication address and shipping address')
            table.string('logo_document_url').comment('Logo URL path for the company')
            table.string('logo_document_path').comment('Path of the uploaded Logo for the company')
            table.tinyint('logo_aws_s3_status').defaultTo(0).comment('0 for New, 1 for Pushed to AWS, 2 for Error')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('company_address', (table) => { // Companies Address details table
            table.increments();
            table.uuid('company_id').index().notNullable().comment('company id')
            table.tinyint('address_type').unsigned().notNullable().comment('1 - Billing Address; 2 - Shipping Address')
            table.string('address_line_one', 200).comment('Address line one details')
            table.string('address_line_two', 200).comment('Address line two details')
            table.string('city', 50)
            table.integer('state_id').index().comment('State ID of the address')
            table.integer('country_id').index().comment('Country ID of the address')
            table.string('zip_code', 12)
            table.boolean('is_default').comment('Default contact')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('company_contacts', (table) => { // Companies contact details table
            table.increments();
            table.uuid('company_id').index().notNullable().comment('company id');
            table.string('first_name', 100).notNullable().comment('first name of the company contact person');
            table.string('middle_name', 100).comment('middle name of the company contact person').nullable();
            table.string('last_name', 50).comment('last name of the company contact person');
            table.string('display_name', 250).comment('display name of the company contact person');
            table.string('contact_number', 12);
            table.string('email_id', 320);
            table.mediumint('ext').nullable();
            table.string('mobile_number', 12);
            table.boolean('is_default').comment('Default contact')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('companies_comments', (table) => {
            table.increments().comment('Companies comments id');
            table.uuid('company_id').index().notNullable().comment('referrable id based on the referrable type');
            table.text('comment').comment('comment');
            table.uuid('created_by').comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('companies_activity_track', (table) => { // To track the company activity/changes
            table.increments();
            table.uuid('company_id').index().notNullable().comment('company id')
            table.tinyint('referrable_type').comment('1 - Company Details, 2 - Contact Details , 3 - Invoice configuration, 4 - Timesheet Configuration').unsigned().notNullable()
            table.integer('referrable_type_id').index().comment('Referrable type id. This may be nullable.')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable()
            table.uuid('created_by').index().notNullable().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        .createTable('company_fields_changes', (table) => { // To track the company field activity/changes
            table.increments();
            table.integer('company_activity_track_id').index().notNullable().comment('company id')
            table.boolean('is_document').defaultTo(false).comment('If any document field was changed set to true')
            table.string('field_name', 100).comment('If is_document is set to true, store the document name else  field name')
            table.string('old_value', 255).comment('Old value')
            table.string('new_value', 255).comment('New value')
        });

};
module.exports = companiesTableSchema;

