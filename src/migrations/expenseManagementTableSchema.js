const expenseManagementTableSchema = async (tenant) => {

    await tenant.schema
        .createTable('expense_management', (table) => { // Expense Management Table schema
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.uuid('employee_id').index().notNullable().comment('Employee_id')
            table.integer('expense_type_id').index().notNullable().comment('id of the expense management type')
            table.string('reference_id', 50).index().comment('expense management reference id')
            table.specificType('amount','double precision').defaultTo(0.00).comment('amount of the expense')
            table.specificType('due_amount','double precision').defaultTo(0.00).comment('Due Amount of the expense')
            table.date('raised_date').comment(' Date of expense raised')
            table.text('description').comment('description of the expense')
            table.date('approved_date').comment('Date of expense approved, if expense is approval enabled flow')
            table.enu('status', ['Drafted', 'Submitted', 'Approval In Progress', 'Deduction In Progress', 'Approved', 'Rejected', 'Reimbursement In Progress', 'Processed', 'Write-off']).index().defaultTo('Submitted').comment('Expense Status');
            table.integer('otp').comment('OTP sent for verification in case of approval enabled flow')
            table.boolean('otp_verified').comment('OTP verification status in case of approval enabled flow')
            table.tinyint('expense_transaction_type').comment('Expense Done by 1-reimbusment(If employee/consultant spend on behalf), 2-deduction(If organization spend to consultant)')
            table.tinyint('expense_effect_on').comment('Expense Effect on 1-payroll, 2-Balancesheet')
            // table.enu('received_status', ['Received', 'Not Received', 'Partially Received']).defaultTo('Not Received').comment('Expense Status');
            table.boolean('enable_approval').defaultTo(false).comment('approval required for expense management')
            table.boolean('has_goal_amount').defaultTo(false).comment('Deduct amount at each interval')
            table.specificType('goal_amount','double precision').defaultTo(0.00).comment('Goal Amount, used for deduction')
            table.boolean('is_recurring').comment('For reimbusment to make recurring. If recuring reimbusment will occur multiple times based on the count')
            table.integer('recurring_count').comment('set the recurring count. If count not set then it occurs till stop. Used for reimbursement')
            table.tinyint('raised_by').notNullable().comment('1 for internal, 2 for consultants or contractors')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })
        .createTable('expense_documents', (table) => {  // Expense Management Supporting documents schema
            table.increments().comment('Document ID')
            table.uuid('expense_id').index().notNullable().comment('Expense id')
            table.string('document_name', 100).comment('Expense document name')
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
        .createTable('expense_transaction_track', (table) => {  // Expenses transaction details
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.uuid('expense_id').index().notNullable().comment('id of the expense management');
            table.integer('payroll_configuration_id').comment('id of the payroll configuration, if deducted/reimbusment through payroll');
            table.specificType('amount','double precision').defaultTo(0.00).comment('Amount deducted/reimbusmented');
            table.date('transaction_date').comment('Amount deducted/reimbusmented date');
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        /**
       * To track the expense changes
       */
        .createTable('expense_activity_track', (table) => { // To track the employee activity/changes
            table.increments()
            table.uuid('expense_id').index().notNullable().comment('Expense id')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable()
            table.uuid('created_by').notNullable().index().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })
        /**
         * To track the expense field change
         */
        .createTable('expense_fields_changes', (table) => {
            table.increments()
            table.integer('expense_activity_track_id').index().notNullable().comment('expense_activity_track id')
            table.string('field_name', 100).comment('Field Name that has been changed in the expense')
            table.string('old_value', 255).comment('Old value')
            table.string('new_value', 255).comment('New value')
        });
};

module.exports = expenseManagementTableSchema;
