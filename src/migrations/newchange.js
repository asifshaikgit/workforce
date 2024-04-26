const newChange = async (tenant) => {
	/*const hasNewSubStatusColumn = await tenant.schema.hasColumn('employee', 'new_sub_status');
  
	await tenant.schema.alterTable('employee', function(table) {
		if (!hasNewSubStatusColumn) {
		table.enu('new_sub_status', ['Marketing', 'Placed']).defaultTo('Marketing').comment('Employee Sub status: Marketing, Placed');
		}
  });

	// Update existing data in the table to reflect the new enum values
	let new_sub_status = await tenant.schema.hasColumn('employee', 'new_sub_status');
	let sub_status = await tenant.schema.hasColumn('employee', 'sub_status');
	if (sub_status && new_sub_status) {
		await tenant('employee')
			.where('sub_status', ['In Training', 'In Marketing'])
			.update({ new_sub_status: 'Marketing' });

		await tenant('employee')
			.where('sub_status', 'In Placement')
			.update({ new_sub_status: 'Placed' });
	}

	if(sub_status){
		const dependentConstraints = await tenant.raw(`
	  SELECT constraint_name
	  FROM information_schema.constraint_column_usage
	  WHERE table_name = 'employee' AND column_name = 'sub_status'
	`);

		// Drop any dependent constraints
	for (const constraint of dependentConstraints.rows) {
	  await tenant.raw(`ALTER TABLE employee DROP CONSTRAINT "${constraint.constraint_name}"`);
	}
	}

	await tenant.schema.alterTable('employee', function(table) {
		if (sub_status) {
			table.dropColumn('sub_status')
		}
	});

	await tenant.schema.alterTable('employee', function(table) {
		if (new_sub_status) {
			table.renameColumn('new_sub_status', 'sub_status')
		}
	});*/

	/*await tenant.schema.alterTable('roles', function(table) {
		table.boolean('is_editable').index().defaultTo(true).comment('Allow user to edit this entry');
	});*/

	/*await tenant.schema.alterTable('emergency_contact_information', function(table) { // Employee contact information
		table.string('name', 100).comment('Name of the contact').alter();
	});*/

	//await tenant.schema.alterTable('employee_address_details', function(table) { // Employee contact information
	//	table.string('address_one', 255).comment('Address one details of an employee').alter();
	//	table.string('address_two', 255).comment('Address two of an employee').alter();
	//});

	//await tenant.schema.alterTable('emergency_contact_information', function(table) { // Employee contact information
	//	table.string('address_1', 255).comment('Address_1 of the contact').alter();
	//	table.string('address_2', 255).comment('Address_2 of the contact').alter();
	//});

	//await tenant.schema.alterTable('employee_personal_documents', function(table) { // Employee contact information
	//	table.integer('document_type_id').comment('Document type id').alter();
	//});

	//await tenant.schema.alterTable('employee_visa_detail_documents', function(table) { // Employee contact information
	//	table.integer('visa_document_type_id').comment('Document type id').alter();
	//});

	//await tenant.schema.alterTable('employee_mapped_documents', function(table) { // Employee contact information
	//	table.integer('referrable_type_id').comment('Referrable module ID').alter();
	//});

	//await tenant.schema.alterTable('employee', function(table) { // Employee contact information
	//	table.boolean('confirm_rehire').comment('Confirmation status for rehire employee');
	//});

	//await tenant.raw(`delete from employee_categories where employment_type_id = (SELECT id from employment_types where name = 'Internal Employee');`);

	//await tenant.raw(`update roles set is_editable = false where id in (1,2,3,4);`);

	// Update Employee Off Boarding Schema
	// await tenant.schema.alterTable('employee_off_boarding', function(table) {
	// 	table.jsonb('placements').comment('Stores the placement ids and its end date')
	// 	table.tinyint('reimbursement_payment').comment('1 -> Add to Balancesheet, 2 -> Write off')
	// 	table.tinyint('deduction_payment').comment('1 -> Deduction from Balancesheet, 2 -> Write off')
	// table.jsonb('expense_ids').comment('Stores the expense Ids for which we are updating the status')
	// });

	/*await tenant.schema.alterTable('invited_employee', (table) => {
		table.datetime('re_requested_on').comment('Re Requested On Date Used to delete the invited employee data after 7 days')
		table.renameColumn('contact_number', 'mobile_number')
		table.string('i9_status').comment('Approval Status of i9 Document')
		table.string('w4_status').comment('Approval Status of w4 Document')
		table.integer('employment_type_id').index().comment('Employment type of employee.')
		table.integer('employee_category_id').index().comment('Employee comes under which category.')
		table.string('profile_picture_url').comment('Profile picture URL')
	});*/

	// await tenant.schema.alterTable('invited_employee', (table) => {
	// 	table.string('i9_status').comment('Approval Status of i9 Document')
	// 	table.string('w4_status').comment('Approval Status of w4 Document')
	// 	table.string('offer_letter_document_name').comment('offer Letter Document Name')
	// });

	/*await tenant.schema.alterTable('invited_employee_emergency_contact', (table) => {
		table.renameColumn('contact_number', 'mobile_number')
	});*/

	// Employee Profile Activity Track new schema
	// await tenant.schema.dropTable('employee_profile_activity_track');
	// await tenant.schema.dropTable('employee_fields_changes');
	// await tenant.schema
	// 	.createTable('employee_profile_activity_track', (table) => {
	// 		table.increments('id').primary().comment('Employee Profile Activity Track ID');
	// 		table.uuid('employee_id').notNullable().index().comment('Employee ID');
	// 		table.string('activity').comment('Name of the activity for a specific module');
	// 		table.jsonb('change_log').comment('Change log of the activity track');
	// 		table.tinyint('action_type').comment('Action Type (1 - Create, 2 - Update, 3 - Delete)');
	// 		table.uuid('created_by').comment('Created By Employee ID');
	// 		table.integer('referrable_type_id').comment('Referrable Type ID');
	// 		table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created Timestamp');
	// 		table.tinyint('referrable_type').comment('1 for basic details, 2 for contact details, 3 for emergency contact details, 4 for current address, 5 for employment details, 6 for passport, 7 for i-94 , 8 for visa , 9 for education , 10 for personal docs, 11 for bank docs, 12 for dependent , 13 for vacation, 14 for skills, 15 for pay configuration, 16 for employee off boarding, 17 for rehire');
	//      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp');
	// 	});
	// await tenant.schema.dropTable('employee_fields_changes');
	// Employee Configuration Activity Schema Changes
	// await tenant.schema.dropTable('configuration_activity_track');
	// await tenant.schema.dropTable('configuration_fields_changes');
	// await tenant.schema.createTable('configuration_activity_track', (table) => { // To track the configurations activity/changes
	// 	table.increments()
	// 	table.integer('referrable_id').index().notNullable().comment('configuration id')
	// 	table.tinyint('referrable_type').index().comment('configuration id  1-employee category, 2-department, 3-educational level, 4-employee team, 5-relationship type, 6-skills, 7-visa type, 8-visa document type, 9-payment mode, 10-write off, 11-invoice taxes, 12-invoice configuration, 13-countries, 14-states, 15-job title, 16-timesheet configuration, 17- self service, 18- net pay terms, 19-document types, 20-aprroval configuration, 21-organization, 22-organization contacts, 23-payroll config setting, 24-prefix, 25-expense types, 26-roles, 27-reminders')
	// 	table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable()
	// 	table.jsonb('change_log').comment('Change Log of the activity')
	// 	table.uuid('created_by').index().comment('Record created employee id')
	// 	table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
	// });

	// await tenant.schema.alterTable('invited_employee_documents', (table) => {
	// 	table.tinyint('document_status').defaultTo(0).unsigned().notNullable().comment('0 - New, 1 - Rejected and 2 -Accepted')
	// 	table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp');
	//  table.string('document_slug', 255).comment('Slug of the document')
	// });

	console.log("Updated")
}

module.exports = newChange;
