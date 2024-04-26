const schemaModifications = async (tenant) => {
	try {
		await tenant.schema.alterTable('companies', (table) => {
			table.specificType('available_balance','double precision').defaultTo(0.00).comment('Current available balance').alter()
		});

		await tenant.schema.alterTable('invoice_taxes', (table) => {
			table.specificType('value','double precision').defaultTo(0.00).comment('Value of the tax that needs to add as a tax').alter();
    });

		await tenant.schema.alterTable('employee', (table) => {
			table.specificType('hours_worked','double precision').defaultTo(0.00).comment('Hours worked by the Employee').alter()
			table.specificType('balance_amount','double precision').defaultTo(0.00).comment('total balance amount to be paid to the employee').alter()
			table.specificType('standard_pay_amount','double precision').defaultTo(0.00).comment('Setting up the standard pay for the employee. By default this pay will be automatically to payroll pay').alter()
			table.specificType('vendor_price_per_hour','double precision').defaultTo(0.00).comment('price per hour for the vendor').alter()
		});

		await tenant.schema.alterTable('employee_bank_account_details', (table) => {
			table.specificType('deposit_value','double precision').defaultTo(0.00).comment('If the depost type is percentage then the value is consider as percentage, If the depost type is value then the value is consider as value.').alter()
		});

		await tenant.schema.alterTable('pay_type_configuration', (table) => {
			table.specificType('pay_value','double precision').defaultTo(0.00).comment('total pay annualy or hourly').alter()
			table.specificType('payroll_pay','double precision').defaultTo(0.00).comment('Pay amount for each payroll. If set salary').alter()
		});

		await tenant.schema.alterTable('pay_rate_configuration', (table) => {
			table.specificType('rate','double precision').defaultTo(0.00).comment('payment amount for this particular hours duration').alter()
		});

		await tenant.schema.alterTable('expense_management', (table) => {
			table.specificType('amount','double precision').defaultTo(0.00).comment('amount of the expense').alter()
			table.specificType('due_amount','double precision').defaultTo(0.00).comment('Due Amount of the expense').alter()
			table.specificType('goal_amount','double precision').defaultTo(0.00).comment('Goal Amount, used for deduction').alter()
    });
		
		await tenant.schema.alterTable('expense_transaction_track', (table) => {
			table.specificType('amount','double precision').defaultTo(0.00).comment('Amount deducted/reimbusmented').alter();
		});
		
		await tenant.schema.alterTable('ledgers', (table) => {
			table.specificType('amount','double precision').defaultTo(0.00).comment('Total amount of the ledger entry').alter()
			table.specificType('sub_total_amount','double precision').defaultTo(0.00).comment('Sub total amount of the ledger entry').alter()
			table.specificType('adjustment_amount','double precision').defaultTo(0.00).comment('Adjustment amount of the ledger entry').alter()
			table.specificType('discount_amount','double precision').defaultTo(0.00).comment('Discount Amount').alter()
			table.specificType('discount_value','double precision').defaultTo(0.00).comment('Discount value').alter()
			table.specificType('tax_amount','double precision').defaultTo(0.00).comment('Tax amount if exists').alter()
			table.specificType('balance_amount','double precision').defaultTo(0.00).comment('Total balance amount for this ledger').alter()
		});
		
		await tenant.schema.alterTable('ledger_item_details', (table) => {
			table.specificType('hours','double precision').defaultTo(0.00).comment('Item hours').alter()
			table.specificType('rate','double precision').defaultTo(0.00).comment('Item rate').alter()
			table.specificType('amount','double precision').defaultTo(0.00).comment('Item amount').alter()
		});
		
		await tenant.schema.alterTable('ledger_payments', (table) => {
			table.specificType('total_received_amount','double precision').defaultTo(0.00).comment('Total Received Amount for this payment').alter()
			table.specificType('bank_charges','double precision').defaultTo(0.00).comment('Bank charges if any for this transaction').alter()
			table.specificType('total_excess_amount','double precision').defaultTo(0.00).comment('Total Excess Amount for this payment').alter()
			table.specificType('debited_credits','double precision').defaultTo(0.00).comment('Credits that used for this payment').alter()
		});
		await tenant.schema.alterTable('ledger_payment_section_details', (table) => {
			table.specificType('received_amount','double precision').defaultTo(0.00).comment('Received Amount for this payment').alter()
		});

		await tenant.schema.alterTable('payroll_payment_details', (table) => {
			table.specificType('total_amount','double precision').defaultTo(0.00).comment('Total amount earned by employee in this payroll').alter()
      table.specificType('amount_paid','double precision').defaultTo(0.00).comment('Amount paid to the employee in this payroll').alter()
      table.specificType('balance_amount','double precision').defaultTo(0.00).comment('Balance amount for employee in this payroll').alter()
      table.specificType('worked_hours','double precision').defaultTo(0.00).comment('Total hours worked for employee in this payroll').alter();
      table.specificType('credited_expense','double precision').defaultTo(0.00).comment('credit expenses amount to the employee, that reimbused in this payroll').alter()
      table.specificType('debited_expense','double precision').defaultTo(0.00).comment('debited expenses amount to the employee, that deducted in this payroll').alter()
    });

		await tenant.schema.alterTable('payroll', (table) => {
			table.specificType('total_amount','double precision').defaultTo(0.00).comment('Total amount earned by employee for this particular placement').alter()
    });

		await tenant.schema.alterTable('placement_billing_details', (table) => {
			table.specificType('bill_rate','double precision').defaultTo(0.00).comment('Bill rate for this placement. If pay type is hourly then bill rate is per hour rate. Else bill rate is annual rate.').alter()
			table.specificType('bill_rate_discount','double precision').defaultTo(0.00).comment('Bill Rate dicount percentage amount').alter()
			table.specificType('ot_bill_rate','double precision').defaultTo(0.00).comment('OT Bill Rate').alter()
			table.specificType('ot_pay_rate_multiplier','double precision').defaultTo(0.00).comment('OT Pay Rate Multiplier').alter()
			table.specificType('ot_pay_rate','double precision').defaultTo(0.00).comment('OT Pay Rate').alter()
		});

	} catch (e) {
		console.log(e.message);
	}
};

module.exports = schemaModifications;