const payrollTableSchema = async (tenant) => {
  await tenant.schema
    .createTable('payroll_payment_details', (table) => { // Payments for employee( multiple payroll will have single payment entry)
      table.increments()
      table.uuid('employee_id').index().notNullable()
      table.integer('payroll_configuration_id').index().notNullable()
      table.specificType('total_amount','double precision').defaultTo(0.00).comment('Total amount earned by employee in this payroll')
      table.specificType('amount_paid','double precision').defaultTo(null).comment('Amount paid to the employee in this payroll')
      table.specificType('balance_amount','double precision').defaultTo(0.00).comment('Balance amount for employee in this payroll')
      table.specificType('worked_hours','double precision').defaultTo(0.00).comment('Total hours worked for employee in this payroll');
      table.specificType('credited_expense','double precision').defaultTo(0.00).comment('credit expenses amount to the employee, that reimbused in this payroll')
      table.specificType('debited_expense','double precision').defaultTo(0.00).comment('debited expenses amount to the employee, that deducted in this payroll')
      table.string('comments').comment('Adding comments for the employee payroll')
      table.boolean('is_finalize').index().defaultTo(false).comment('To mark this employee payment as verified and finalized. Once finilize not allowed to edit')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })

    // auto generated payroll details stored table
    .createTable('payroll', (table) => {
      table.increments()
      table.uuid('employee_id').index().notNullable().comment('employee ID')
      table.integer('payroll_configuration_id').index().notNullable().comment('payroll configuration id')
      table.specificType('total_amount','double precision').defaultTo(0.00).comment('Total amount earned by employee for this particular placement')
      table.uuid('placement_id').comment('Payroll Placement Id. Can br nullable if payroll runs without placement')
      table.boolean('timesheet_approval_pending').defaultTo(false).comment('For the particular payroll placement, if the employee timesheets are pending mark them as true.')
      table.json('hours_rate_information').comment('Payrate and hours rate information for this payroll period')
      table.uuid('created_by').comment('Record created employee id')
      table.uuid('updated_by').comment('Record updated employee id')
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
      table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    });
};
module.exports = payrollTableSchema;