
//Default creating roles and allocating roles permissions to the defult roles
const rolePermissionsDataSeed = async (tenant) => {

  let rolesData = await tenant('roles')
    .select('*')
    .whereNull('deleted_at');

  if (rolesData.length > 0) {

    /* Using Map to iterate the loop and prepare the response */
    await rolesData.map(async (item) => {
      if (item.name == 'Super Admin') {
        var sulgs_in = ['employee_create', 'employee_edit', 'employee_view', 'employee_delete', 'employee_additional_permissions', 'employee_active_inactive', 'employee_disable_enable', 'client_create', 'client_edit', 'client_view', 'client_delete', 'client_additional_permissions', 'client_overview', 'client_comments', 'client_transactions', 'client_statement', 'end_client_create', 'end_client_edit', 'end_client_view', 'end_client_delete', 'end_client_additional_permissions', 'placement_create', 'placement_edit', 'placement_view', 'placement_delete', 'placement_additional_permissions', 'client_statement', 'timesheet_create', 'timesheet_edit', 'timesheet_view', 'timesheet_delete', 'timesheet_additional_permissions', 'invoice_create', 'invoice_edit', 'invoice_view', 'invoice_delete', 'invoice_additional_permissions', 'employee_self_service_create', 'employee_self_service_edit', 'employee_self_service_view', 'employee_self_service_delete', 'employee_self_service_additional_permissions', 'expense_management_create', 'expense_management_edit', 'expense_management_view', 'expense_management_delete', 'expense_management_additional_permissions', 'bill_create', 'bill_edit', 'bill_view', 'bill_delete', 'bill_additional_permissions', 'payment_additional_permissions', 'dashboard', 'configurations_create', 'configurations_edit', 'configurations_view', 'configurations_delete', 'configurations_additional_permissions', 'configuration_organization', 'configuration_employee', 'configuration_placement', 'configuration_timesheet', 'configuration_invoice', 'configuration_expense_and_self_service', 'configuration_client', 'configuration_role', 'configuration_template', 'configuration_reminder', 'configuration_group', 'configuration_notification', 'payroll_create', 'payroll_edit', 'payroll_view', 'payroll_delete', 'payroll_additional_permissions', 'balance_sheet_create', 'balance_sheet_edit', 'balance_sheet_view', 'balance_sheet_delete', 'balance_sheet_additional_permissions', 'vendor_create', 'vendor_edit', 'vendor_view', 'vendor_delete', 'vendor_additional_permissions', 'vendor_overview', 'vendor_comments', 'vendor_transactions', 'vendor_statement', 'bill_payment_create', 'bill_payment_edit', 'bill_payment_view', 'bill_payment_delete', 'invoice_payment_create', 'invoice_payment_edit', 'invoice_payment_view', 'invoice_payment_delete', 'configuration_expense_management_types', 'configuration_employee_self_service_types'];

        let supAdmPermissionData = await tenant('permissions')
          .select('*')
          .whereIn('slug', sulgs_in);

        for (let key in supAdmPermissionData) {
          let saPer = supAdmPermissionData[key];
          createObject = {
            permission_id: saPer.id,
            role_id: item.id,
            is_allowed: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('role_permissions').insert(createObject);
        }
      } else if (item.name == 'HR Admin') {
        var sulgs_in = ['employee_create', 'employee_edit', 'employee_view', 'employee_delete', 'employee_additional_permissions', 'employee_active_inactive', 'employee_disable_enable', 'employee_everification', 'employee_add_edit_bank', 'employee_add_edit_payroll_settings', 'employee_add_edit_payconfig', 'employee_export', 'employee_import', 'client_create', 'client_edit', 'client_view', 'client_delete', 'client_additional_permissions', 'client_overview', 'client_comments', 'client_transactions', 'client_statement', 'client_export', 'client_import', 'end_client_create', 'end_client_edit', 'end_client_view', 'end_client_delete', 'end_client_additional_permissions', 'end_client_export', 'end_client_import', 'placement_create', 'placement_edit', 'placement_view', 'placement_delete', 'placement_additional_permissions', 'placement_export', 'placement_import', 'client_statement', 'timesheet_view', 'invoice_view', 'employee_self_service_view', 'expense_management_view', 'bill_view', 'dashboard','invoice_payment_view', 'configurations_view', 'payroll_view', 'balance_sheet_view', 'vendor_view', 'bill_payment_view'];

        let hrPermissionData = await tenant('permissions')
          .select('*')
          .whereIn('slug', sulgs_in);

        for (let key in hrPermissionData) {
          let hrPer = hrPermissionData[key];
          createObject = {
            permission_id: hrPer.id,
            role_id: item.id,
            is_allowed: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('role_permissions').insert(createObject);
        };
      } else if (item.name == 'Payroll Admin') {
        var sulgs_in = ['balance_sheet_create', 'balance_sheet_edit', 'balance_sheet_view', 'balance_sheet_delete', 'balance_sheet_additional_permissions', 'expense_management_create', 'expense_management_edit', 'expense_management_view', 'expense_management_delete', 'expense_management_additional_permissions', 'payroll_create', 'payroll_edit', 'payroll_view', 'payroll_delete', 'payroll_additional_permissions', 'employee_view', 'client_view', 'end_client_view', 'placement_view', 'timesheet_view', 'invoice_view', 'employee_self_service_view', 'bill_view', 'dashboard', 'invoice_payment_view', 'configurations_view', 'vendor_view', 'bill_payment_view'];

        let payrollAdminPermissionData = await tenant('permissions')
          .select('*')
          .whereIn('slug', sulgs_in);

        for (let key in payrollAdminPermissionData) {
          let paPermission = payrollAdminPermissionData[key];
          createObject = {
            permission_id: paPermission.id,
            role_id: item.id,
            is_allowed: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('role_permissions').insert(createObject);
        };
      } else if (item.name == 'Accounts Admin') {
        var sulgs_in = ['timesheet_create', 'timesheet_edit', 'timesheet_view', 'timesheet_delete', 'timesheet_additional_permissions', 'invoice_create', 'invoice_edit', 'invoice_view', 'invoice_delete', 'invoice_additional_permissions', 'bill_payment_create', 'bill_payment_edit', 'bill_payment_view', 'bill_payment_delete', 'invoice_payment_create', 'invoice_payment_edit', 'invoice_payment_view', 'invoice_payment_delete', 'employee_view', 'client_view', 'end_client_view', 'placement_view', 'employee_self_service_view', 'expense_management_view', 'bill_view', 'dashboard', 'configurations_view', 'payroll_view', 'balance_sheet_view', 'vendor_view'];

        let accountantPermissionData = await tenant('permissions')
          .select('*')
          .whereIn('slug', sulgs_in);
        for (let key in accountantPermissionData) {
          let accountPer = accountantPermissionData[key];
          createObject = {
            permission_id: accountPer.id,
            role_id: item.id,
            is_allowed: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('role_permissions').insert(createObject);
        };
      }
    });
    /* Using Map to iterate the loop and prepare the response */
  }
};

module.exports = rolePermissionsDataSeed;
