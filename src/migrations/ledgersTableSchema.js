const ledgerTablesSchema = async (tenant) => {

    await tenant.schema
        .createTable('ledgers', (table) => {  // Table to store the finincial related things like bills and invoices. Only 5 to 6 columns are extra used from invoices ledgers. So I am combining them
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.uuid('company_id').index().notNullable().comment('Company ID for the ledger')
            table.string('entity_type').index().notNullable().comment('invoices, bills')
            table.string('reference_id', 20).unique().notNullable().comment('Reference ID for the ledger')
            table.string('comments', 255).comment('Remarks/Comments for the ledger')
            table.boolean('enable_approval').defaultTo(false).comment('For Bills there is no approval as of now. Based on this approval status will followed.')
            table.string('order_number', 30).nullable().comment('Order number for the ledger')
            table.date('date').index().nullable().comment('Date of the ledger')
            table.date('due_date').comment('Due date for the ledger')
            table.integer('net_pay_terms_id').comment('Net Payterms ID')
            table.specificType('amount','double precision').defaultTo(0.00).comment('Total amount of the ledger entry')
            table.specificType('sub_total_amount','double precision').defaultTo(0.00).comment('Sub total amount of the ledger entry')
            table.specificType('adjustment_amount','double precision').defaultTo(0.00).comment('Adjustment amount of the ledger entry')
            table.integer('discount_type').comment('1-Fixed value, 2-Percentage value')
            table.specificType('discount_amount','double precision').defaultTo(0.00).comment('Discount Amount')
            table.specificType('discount_value','double precision').defaultTo(0.00).comment('Discount value')
            table.specificType('tax_amount','double precision').defaultTo(0.00).comment('Tax amount if exists')
            table.specificType('balance_amount','double precision').defaultTo(0.00).comment('Total balance amount for this ledger')
            table.text('customer_note').comment('Notes of the ledgers')
            table.text('terms_and_conditions').comment('Terms and conditions of the ledgers')
            table.date('expected_payment_date').comment('To mark expected payment paid/received date')
            table.integer('approval_level').unsigned().comment('Current approval level of the ledger')
            table.json('tax_information').comment('tax information of the ledger')
            table.boolean('enable_reminder').comment('To enable the reminder notification')
            table.boolean('enable_recurring').defaultTo(false).comment('to set recurring for the email')
            table.date('next_recurring_date').defaultTo(null).comment('If recurring is enabled then store the next recurring date')
            table.boolean('is_void').defaultTo(false).comment('To mark this entry as void')
            table.boolean('is_sent').defaultTo(false).comment('Sent Key')
            table.integer('write_off_id').comment('Write off id')
            table.string('description').comment('Description if the ledger is write off')
            table.string('reject_reason').comment('Reason for rejection of ledger')
            table.enu('status', ['Drafted', 'Approval In Progress', 'Approved', 'Rejected', 'Partially Paid', 'Paid', 'Void', 'Write Off', 'Submitted']).index().defaultTo('Submitted').comment('Expense Status');
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('submitted_on').comment('Record the timestamp of submitted on')
            table.timestamp('approved_on').comment('Record the timestamp of last approved on')
            table.timestamp('drafted_on').comment('Record the timestamp of draft on')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('ledger_item_details', (table) => {    // Ledger Item detailed information
            table.increments()
            table.uuid('ledger_id').index().notNullable().comment('Ledger table id')
            table.uuid('employee_id').index().notNullable().defaultTo(null).comment('Employee ID')
            table.uuid('placement_id').index().comment('Placement ID')
            table.string('description', 255).comment('Description of the billing')
            table.boolean('timesheets_available').comment('To check if ledger Raised against Timesheet')
            table.specificType('hours','double precision').defaultTo(0.00).comment('Item hours')
            table.string('service_name', 255).defaultTo(null).comment('Service Name of the ledger item details')
            table.specificType('rate','double precision').defaultTo(0.00).comment('Item rate')
            table.specificType('amount','double precision').defaultTo(0.00).comment('Item amount')
            table.specificType('timesheet_hour_ids', 'integer[]').comment('If item is generated from timesheets, storing the timesheet hour ids.')
            table.string('information', 255).defaultTo(null).comment('To add any reference information for this item. Mostly used in auto generated invoices.')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('ledger_documents', (table) => {   // Ledger Documents information
            table.increments()
            table.uuid('ledger_id').index().notNullable().comment('Ledger ID')
            table.string('document_name', 100).comment('Ledger reference uploaded document/file name')
            table.string('document_url', 255).comment('Ledger reference uploaded document/file access url')
            table.string('document_path', 255).comment('Ledger reference uploaded document/file located path')
            table.tinyint('document_status').comment('0 - New, 1 - Rejected and 2 -Accepted');
            table.boolean('aws_s3_status').defaultTo(false).comment('AWS uploaded status of the document')
            table.string('comments', 255).comment('description of the document')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('ledger_recurring_configurations', (table) => {  // Ledger Recurring Configuration
            table.increments()
            table.uuid('ledger_id').index().notNullable().comment('Ledger ID')
            table.integer('recurring_cycle_type').comment('1 for day/daily, 2 for week, 3 for month, 4 year')
            table.integer('recurring_cycle_number').comment('Based on the recurring_cycle_type and recurring_cycle_number, the recurring will happen. Example: recurring for 2 days once, recurring for 4 days, recurring for 2 weeks once, recurring for 1 week once. Start date will be mark as start day')
            table.date('recurring_start_date').comment('start date of the recurring cycle')
            table.date('recurring_end_date').comment('start date of the recurring cycle')
            table.string('record_payment').comment('Record Payment at the time recurring')
            table.boolean('recurring_never_expires').defaultTo(false).comment('To mark recurring as never expires')
            table.integer('recurring_count').defaultTo(0).comment('Number of recurrings ledgers, that this ledger generated')
            table.boolean('is_custom').defaultTo(false).comment('to check if its is custom or not')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        /**
         * To track the Ledger Approvals
         */
        .createTable('ledger_approval_track', (table) => { // To track the Timesheet activity/changes 
            table.increments()
            table.uuid('ledger_id').index().notNullable().comment('Ledger ID')
            table.uuid('approval_user_id').index().notNullable().comment('Ledger Approved user id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        .createTable('ledger_payments', (table) => { // To store the payment details for the Ledgers
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary().comment('payment Id')
            table.uuid('company_id').index().notNullable().comment('Company id for the payment')
            table.string('reference_id', 30).unique().notNullable().comment('Reference ID for the payment. Auto generated')
            table.specificType('total_received_amount','double precision').defaultTo(0.00).comment('Total Received Amount for this payment')
            table.specificType('bank_charges','double precision').defaultTo(0.00).comment('Bank charges if any for this transaction')
            table.specificType('total_excess_amount','double precision').defaultTo(0.00).comment('Total Excess Amount for this payment')
            table.date('received_on').comment('Payment received amount')
            table.string('entity_type').index().notNullable().comment('payment, bill-payment')
            table.integer('payment_mode_id').comment('Payment mode id of the payment')
            table.specificType('debited_credits','double precision').defaultTo(0.00).comment('Credits that used for this payment')
            table.string('payment_reference_number').comment('Payment transaction Reference Id.')
            table.text('notes').comment('Reference Notes against the payment')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('ledger_payment_section_details', (table) => { // To store the ledger payment section details
            table.increments().comment('Payment Section details Id')
            table.uuid('ledger_id').index().notNullable().comment('ledger id for this payment')
            table.uuid('ledger_payment_id').index().notNullable().comment('Invoice Id')
            table.specificType('received_amount','double precision').defaultTo(0.00).comment('Received Amount for this payment')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('ledger_payment_documents', (table) => {   // Ledger Documents information
            table.increments()
            table.uuid('ledger_payment_id').index().notNullable().comment('Invoice Id')
            table.string('document_name', 100).comment('Ledger reference uploaded document/file name')
            table.string('document_url', 255).comment('Ledger reference uploaded document/file access url')
            table.string('document_path', 255).comment('Ledger reference uploaded document/file located path')
            table.tinyint('document_status').comment('0 - New, 1 - Rejected and 2 -Accepted');
            table.boolean('aws_s3_status').defaultTo(false).comment('AWS uploaded status of the document')
            table.string('comments', 255).comment('description of the document')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        /**
          * To track the Ledger Payments changes
          */
        .createTable('ledger_payment_activity_track', (table) => { // To track the Timesheet activity/changes 
            table.increments()
            table.uuid('ledger_payment_id').index().notNullable().comment('Ledger ID')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable()
            table.text('activity').comment('Description of the activity')
            table.uuid('created_by').index().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        // Ledger Addresses
        .createTable('ledger_addresses', (table) => {
            table.increments();
            table.uuid('ledger_id').index().notNullable().comment('Ledger table id');
            table.tinyint('address_type').comment('2 for shipping, 1 for billing').unsigned().notNullable()
            table.string('address_line_one', 200).comment('Enter address line one');
            table.string('address_line_two', 200).comment('Enter address line two');
            table.string('zip_code', 10).comment('Enter the state');
            table.string('city', 50).comment('Enter the city');
            table.integer('state_id').index().comment('Enter the state id');
            table.integer('country_id').index().comment('Enter the country id');
        })

        /**
        * To track the Actions happening on a Ledger
        */
        .createTable('ledger_activity_track', (table) => { // To track the Timesheet activity/changes
            table.increments()
            table.uuid('ledger_id').index().notNullable().comment('Ledger ID')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete of ledger_item_details').unsigned().notNullable()
            table.uuid('created_by').index().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        /**
        * To track the Ledger Field changes and Ledger Item details changes
        */
        .createTable('ledger_fields_changes', (table) => {
            table.increments()
            table.integer('ledger_activity_track_id').index().notNullable().comment('ledger_activity_track id')
            table.integer('ledger_item_details_id').index().comment('ledger_item_details_id if any changes made in the ledger_item_details')
            table.string('field_name', 100).comment('Field Name that has been changed in the ledger and ledger_item_Details')
            table.string('old_value', 255).comment('Old value')
            table.string('new_value', 255).comment('New value')
        })

        /**
        * To track the Ledger Field changes and Ledger Item details changes
        */
        .createTable('ledger_payment_activity_fields_changes', (table) => {
            table.increments()
            table.integer('ledger_payment_activity_track_id').index().notNullable().comment('ledger payment activity track id id')
            table.integer('ledger_payment_section_details_id').index().comment('ledger_payment_section_details_id')
            table.string('field_name', 100).comment('Field Name that has been changed in the ledger and ledger_item_Details')
            table.string('old_value', 255).comment('Old value')
            table.string('new_value', 255).comment('New value')
        })
};
module.exports = ledgerTablesSchema;
