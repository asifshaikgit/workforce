const placementTablesSchema = async (tenant) => {

    await tenant.schema
        .createTable('placements', (table) => { // Placement information
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.uuid('employee_id').index().notNullable().comment('Employee ID for this placement')
            table.string('reference_id', 50).index().notNullable().comment('Placement Reference ID')
            table.uuid('client_id').index().notNullable().comment('client id for this placement')
            table.uuid('end_client_id').index().comment('end_client id for this placement')
            table.string('project_name', 100).comment('Name of the project that employee will work')
            table.integer('job_title_id').index().comment('Job title ID')
            table.string('work_email_id').comment('Work email id of the employee')
            table.uuid('placed_employee_id').comment('Internal Employee Who placed placement this placement')
            table.integer('notice_period').comment('number of days notice period for this placement')
            table.date('start_date').comment('placement start date')
            table.date('end_date').comment('placement completed date')
            table.tinyint('invoice_settings_config_type').comment('1 - Global, 2 - Client and 3 - Custom')
            table.integer('invoice_configuration_id').comment('Based on this id only invoices will be generated')
            table.tinyint('invoice_approval_config_type').comment('1 - Global, 2 - Client and 3 - Custom')
            table.integer('invoice_approval_id').comment('Based on this only INVOICE approval steps will happen')
            table.date('invoice_start_date').comment('Invoie raise start date. When the Invoie generation will be start.')
            table.date('inv_next_cycle_start').comment('Invoice Next cycle start date. The date when the new invoice automaically generates')
            table.tinyint('timesheet_settings_config_type').comment('1 - Global, 2 - Client and 3 - Custom')
            table.integer('timesheet_configuration_id').comment('Based on this only this placement time sheets will be generated')
            table.tinyint('timesheet_approval_config_type').comment('1 - Global, 2 - Client and 3 - Custom')
            table.integer('timesheet_approval_id').comment('Based on this only time sheet approval steps will happen')
            table.date('timesheet_start_date').comment('Time Sheet start date. When the time sheet generation will be start.')
            table.date('ts_next_cycle_start').comment('Timesheet Next cycle start date. The date when the new timesheet automaically generates')
            table.tinyint('payroll_configuration_type').comment('1 - Global and 2 - Custom')
            table.integer('pay_type_configuration_id').comment('Based on this id only payroll will be generated for this placement. If global employee mapped will be stored else a new entry will be created and mapped here.')
            table.tinyint('work_location_type').defaultTo(1).comment('1 for remote and 2 for on site i.e. client location')
            table.string('work_location_address_line_one', 150).comment('address line 1 for on site location')
            table.string('work_location_address_line_two', 150).comment('address line 2 for on site location')
            table.string('work_location_city', 50).comment('city of the work location')
            table.integer('work_location_state_id').comment('state id of the work location')
            table.integer('work_location_country_id').comment('country id of the work location')
            table.string('work_location_zipcode', 12).comment('zipcode of the work location')
            table.boolean('regenerate_timesheet').defaultTo(false).comment('Flag to control the cron scheduler time sheet generation for this placement')
            table.boolean('project_closed').defaultTo(false).comment('Used to set a project closed. When all the timesheets and invoices for this project are done then mark this project as closed.')
            table.enu('status', ['Completed', 'In Progress']).defaultTo('In Progress').comment('Placement status: Completed, or In Progress');
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('placement_billing_details', (table) => { // Placement billing details table
            table.increments()
            table.uuid('placement_id').index().notNullable().comment('placement ID')
            table.tinyint('bill_type').defaultTo(2).comment('Bill type for this placement. Bill type will salary or hourly. 1 - Salary and 2 - Hourly.')
            table.specificType('bill_rate','double precision').defaultTo(0.00).comment('Bill rate for this placement. If pay type is hourly then bill rate is per hour rate. Else bill rate is annual rate.')
            table.date('effective_from').index().comment('Bill rate is effective from date')
            table.date('effective_to').index().comment('Bill rate is effective till date')
            table.boolean('current_rate').comment('is current rate being applied')
            table.tinyint('bill_rate_discount_type').index().comment('discount bill type. 1 - Percentage , 2 - Value')
            table.specificType('bill_rate_discount','double precision').defaultTo(0.00).comment('Bill Rate dicount percentage amount')
            table.tinyint('ot_pay_rate_config_type').comment('OT Pay Config Type. 1 Same as pay rate. 2 is fixed value. 3 is for variable and calculated based on the multiplier and current payrate')
            table.specificType('ot_bill_rate','double precision').defaultTo(0.00).comment('OT Bill Rate')
            table.specificType('ot_pay_rate_multiplier','double precision').defaultTo(0.00).comment('OT Pay Rate Multiplier')
            table.specificType('ot_pay_rate','double precision').defaultTo(0.00).comment('OT Pay Rate')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('placement_documents', (table) => {  // Placement Documents
            table.increments()
            table.uuid('placement_id').index().notNullable().comment('Expense id')
            table.integer('document_type_id').notNullable().comment('Placement Document Type ID')
            table.string('document_name', 100).comment('Placeent document name')
            table.tinyint('document_status').defaultTo(0).unsigned().notNullable().comment('0 - New, 1 - Rejected and 2 -Accepted')
            table.string('document_url').comment('time sheet document url')
            table.string('document_path').comment('Path of the uploaded document')
            table.boolean('aws_s3_status').defaultTo(false).comment('AWS uploaded status')
            table.string('comments', 255).comment('comments of the document')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('placement_companies_contacts', (table) => {   // Placement Documents
            table.increments()
            table.uuid('placement_id').index().notNullable().comment('placement ID')
            table.string('referrable_type').index().notNullable().comment('clients, end-clients')
            table.integer('companies_contact_id').index().notNullable().comment('name of the uploaded document')
            table.mediumint('priority').unsigned().comment('based on this priority we will contact end client')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        /**
         * To track the Placement changes
         */

        .createTable('placement_activity_track', (table) => {
            table.increments('id').primary().comment('Placement Profile Activity Track ID');
            table.uuid('placement_id').notNullable().index().comment('Placement ID');
            table.tinyint('referrable_type').notNullable().comment('1 for client & end-clients, 2 for billing-details, 3 for timesheet_configuration, 4 for invoice configuration');
            table.integer('referrable_type_id').comment('Referrable Type ID');
            table.tinyint('action_type').comment('Action Type (1 - Create, 2 - Update, 3 - Delete)');
            table.uuid('created_by').comment('Created By Employee ID');
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created Timestamp');
        })

        .createTable('placement_fields_changes', (table) => {
            table.increments('id').primary().comment('Placement Fields Changes ID');
            table.integer('placement_activity_track_id').comment('Placement Profile Activity Track ID');
            table.boolean('is_document_modified').comment('Is Document Modified');
            table.string('field_name', 255).comment('Field Name');
            table.text('old_value', 255).comment('Old Value');
            table.text('new_value', 255).comment('New Value');
        });
};

module.exports = placementTablesSchema;
