const getEnumTest = async (tenantDb) => {
    try {


        // await tenantDb.schema.alterTable('employee', (table) => {
        //     table.dropColumn('drafted_stage');
        // });

        // await tenantDb.schema.alterTable('expense_management', (table) => {
        //     table.enu('new_status', ['Submitted', 'Approved', 'Approval In Progress', 'Rejected', 'Deduction In Progress', 'Processed', 'Reimbursement In Progress']).comment('Expense Status');
        // .defaultTo('Submitted')
        // });

        // await tenantDb.schema.alterTable('timesheets', (table) => {
        //     // table.timestamp('submitted_on').comment('Record the timestamp of submitted on')
        //     table.timestamp('approved_on').comment('Record the timestamp of last approved on')
        //     table.timestamp('drafted_on').comment('Record the timestamp of draft on')
        // });
        // })

        // await tenantDb.schema.alterTable('company_contacts', (table) => {
        //     table.boolean('is_default').comment('Default contact')
        // })

        // await tenantDb.schema.alterTable('company_address', (table) => {
        //     table.boolean('is_default').comment('Default Address')
        // })

        // await tenantDb.schema.alterTable('assignee_employees', (table) => {
        //     table.timestamp('deleted_at').comment('deleted')
        // });

        await tenantDb.schema.alterTable('reminders', (table) => {
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
            table.enu('status', ['Pending', 'Completed', 'Stop']).defaultTo('Pending').notNullable();
        });

    } catch (e) {
        console.log(e.message);
    }
};

module.exports = getEnumTest;