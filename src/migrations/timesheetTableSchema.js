const timesheetTablesSchema = async (tenant) => {

    await tenant.schema
        .createTable('timesheets', (table) => { // Timesheet table
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.uuid('placement_id').index().notNullable().comment('Placement id for this timesheet')
            table.string('reference_id', 50).unique().notNullable().comment('Timesheet Reference ID')
            table.date('from').index().comment('Timesheet from date')
            table.date('to').index().comment('Timesheet to date')
            table.specificType('total_hours', 'interval').defaultTo('00:00:00').comment('Total hours for this timesheet period')
            table.specificType('total_billable_hours', 'interval').defaultTo('00:00:00').comment('Billable hours for this timesheet period')
            table.specificType('total_non_billable_hours', 'interval').defaultTo('00:00:00').comment('Non Billable hours for this timesheet period')
            table.specificType('total_ot_hours', 'interval').defaultTo('00:00:00').comment('Total OT hours for this timesheet period')
            table.string('comments', 255).comment('Comments/Remarks for this timeperiod hours')
            // table.tinyint('approved_status').comment('Status of the Timesheet. 0 - Drafted, 1 - Submit , 2 - Partiall Approved and 3- Approved and 4 - Rejected')
            table.enu('status', ['Drafted', 'Submitted', 'Approval In Progress', 'Approved', 'Rejected']).index().defaultTo('Drafted').comment('Timesheet status');
            table.integer('approval_level').comment('Current Approval Level')
            table.timestamp('submitted_on').index().defaultTo(null).comment('Record deleted timestamp')
            table.uuid('submitted_by').index().defaultTo(null).comment('Submitted by employee.')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
            table.timestamp('approved_on').comment('Record the timestamp of last approved on')
            table.timestamp('drafted_on').comment('Record the timestamp of draft on')
        })
        .createTable('timesheet_documents', (table) => {  // Timesheet uploaded documents information table
            table.increments().comment('Document ID')
            table.uuid('timesheet_id').index().notNullable().comment('Time sheet details id')
            table.string('document_name', 100).comment('Timesheet period reference uploaded document/file name')
            table.string('document_url', 255).comment('Timesheet period reference uploaded document/file access url')
            table.string('document_path', 255).comment('Timesheet period reference uploaded document/file located path')
            table.tinyint('document_status').defaultTo(0).unsigned().notNullable().comment('0 - New, 1 - Rejected and 2 -Accepted')
            table.boolean('aws_s3_status').defaultTo(false).comment('AWS uploaded status of the document')
            table.string('comments', 255).comment('Remarks/Comments for the uploaded document')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('timesheet_hours', (table) => {  // Timesheet hours information table
            table.increments().comment('Timesheet hours ID')
            table.uuid('timesheet_id').index().notNullable().comment('Timesheet id')
            table.date('date').comment('Consultant/Employee worked date')
            table.time('total_hours').defaultTo('00:00:00').comment('Total Employee worked hours on that day')
            table.time('ot_hours').defaultTo('00:00:00').comment('OT Hours on that day')
            table.time('billable_hours').defaultTo('00:00:00').comment('Billable hours on that day')
            table.time('non_billable_hours').defaultTo('00:00:00').comment('Non Billable hours on that day')
            table.string('comments', 255).comment('Comments for that particular date')
            table.boolean('invoice_raised').defaultTo(false).comment('Invoice raised for this date')
            table.boolean('payroll_raised').defaultTo(false).comment('To check if invoice raised for this date')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        /**
         * To track the Timesheet changes
         */
        // .createTable('timesheet_approval_track', (table) => { // To track the Timesheet activity/changes 
        //     table.increments()
        //     table.uuid('timesheet_id').index().notNullable().comment('Placement id')
        //     table.uuid('approval_user_id').index().notNullable().comment('Timesheet Approved user id')
        //     table.integer('approval_level').comment('Current Approval Level')
        //     table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        // })

        /**
      * To track the Timesheet changes
      */
        .createTable('timesheet_activity_track', (table) => { // To track the Timesheet activity/changes
            table.increments()
            table.uuid('timesheet_id').index().notNullable().comment('Placement id')
            table.boolean('is_document_modified').default(false).comment('true If document modified')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete, 4 for approval').unsigned().notNullable()
            table.text('delete_hour_ids').comment('ids of time_sheet_hours')
            table.uuid('approval_user_id').index().comment('Timesheet Approved user id')
            table.integer('approval_level').comment('Current Approval Level')
            table.uuid('created_by').index().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        /**
         * To Track the timesheet field changes
         */
        .createTable('timesheet_fields_changes', (table) => { // To track the field changes made in the Timesheet
            table.increments().comment('Time fields change id')
            table.integer('timesheet_activity_track_id').comment('Reference id for timesheet_activity_track-table')
            table.integer('timesheet_hours_id').comment('Reference id for "timesheet_hours" table if any change in "ot_hours" & "billable_hours"')
            table.string('field_name', 50).comment('Name of the field changes')
            table.string('old_value', 255).comment('Old value present in table')
            table.string('new_value', 255).comment('New value for update')
        });
};

module.exports = timesheetTablesSchema;