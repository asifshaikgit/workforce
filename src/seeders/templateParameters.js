//Params that using for the email templates
const templateParametersData = [

  {
    module_slug: 'expense-approved',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approved',
    parameter: '{{date}}',
    created_at: new Date(),
  },

  {
    module_slug: 'expense-submitted',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-submitted',
    parameter: '{{date}}',
    created_at: new Date(),
  },

  {
    module_slug: 'expense-rejected',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-rejected',
    parameter: '{{date}}',
    created_at: new Date(),
  },

  {
    module_slug: 'expense-employer-approval',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employer-approval',
    parameter: '{{date}}',
    created_at: new Date(),
  },

  {
    module_slug: 'expense-employee-approval',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-employee-approval',
    parameter: '{{date}}',
    created_at: new Date(),
  },

  {
    module_slug: 'expenses',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{currency}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{expense_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{middle_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{approve_link}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{expense_description}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expenses',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{project_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{start_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{end_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{job_title}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{end_client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{notice_period}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{work_email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{password}}',
    created_at: new Date(),
  },
  {
    module_slug: 'forgot-password',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{password}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'update-password',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'otp',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'otp',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'otp',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'otp',
    parameter: '{{otp}}',
    created_at: new Date(),
  },
  {
    module_slug: 'otp',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{password}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{user_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-employee-onboard',
    parameter: '{{sub_domain_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{password}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{sub_domain_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'enable-user-access',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'disable-user-access',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'disable-user-access',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'disable-user-access',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {

    module_slug: 'disable-user-access',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'disable-user-access',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{timesheet_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{timesheet_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{placement_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-pending',
    parameter: '{{current_approval_level}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{password}}',
    created_at: new Date(),
  },
  {
    module_slug: 'reset-password',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{invoice_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{invoice_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'send-invoice',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{invoice_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{current_approval_level}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{invoice_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-pending',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{timesheet_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{timesheet_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{timesheet_approval_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{timesheet_approval_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approved-notification',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employee',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employee',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employee',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employee',
    parameter: '{{reference_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employee',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employer',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employer',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employer',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employer',
    parameter: '{{reference_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'self-service-request-employer',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{timesheet_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{timesheet_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-rejected',
    parameter: '{{timesheet_referance_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{approver_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{timesheet_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{placement_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{timesheet_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-reminder',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{invoice_drafted_on}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{invoice_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-reminder',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{total_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{timesheet_url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{invoice_url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{balance_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{organization_email}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_one}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_two}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_pincode}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_country}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_state}}',
    created_at: new Date(),
  },
  {
    module_slug: 'client-invoice-generation',
    parameter: '{{client_address_city}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_one}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_two}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_city}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_state}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_country}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{client_address_pincode}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{payment_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{total_amount_payable}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{balance_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{refund_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{payment_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'payment-received',
    parameter: '{{payment_mode}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{invoice_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{invoice_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-rejected',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{sub_total_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{vendor_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{vendor_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_reference_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_document_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{bill_document_url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-reminder',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'application-url',
    parameter: '{{sub_domain_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{expense_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{expense_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{expense_description}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{reference_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{expense_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-notification',
    parameter: '{{approver_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{invoice_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{invoice_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-generated',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{timesheet_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{timesheet_status}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{timesheet_total_hours}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-generated',
    parameter: '{{timesheet_refrence_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation',
    parameter: '{{invitation_url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation',
    parameter: '{{expiry_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{invitation_url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{expiry_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-reminder',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{email_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invite-employee',
    parameter: '{{onboarding_link}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{placement_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{invoice_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-invoices',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{client_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{placement_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{placement_start_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{placement_end_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{job_title}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placements-expiry',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{employee_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{visa_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{visa_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{visa_start_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{visa_end_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'work-authorization-documents',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{employee_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{document_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{document_type}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{document_start_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{document_end_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'personal-documents',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{employee_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{timesheet_from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{timesheet_cycle}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{timesheet_to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'draft-timesheets',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays',
    parameter: '{{employee_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays',
    parameter: '{{age}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{total_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{bill_due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{bill_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{bill_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{vendor_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{balance_amount}}',
    created_at: new Date(),
  },
  {
    module_slug: 'bill-payment',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{first_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{last_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{organization_name}}',
    created_at: new Date(),
  },
   {
    module_slug: 'immigration-questionnaire',
    parameter: '{{organization_signature}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{url}}',
    created_at: new Date(),
  },
  {
    module_slug: 'immigration-questionnaire',
    parameter: '{{immigration_reference_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'consultant-invitation-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'birthdays-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement-expiry-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement-expiry-notification',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement-expiry-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'placement-expiry-notification',
    parameter: '{{placement_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{from_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-timesheet-notification',
    parameter: '{{to_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-notification',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-notification',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-notification',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-approval-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-invoice-notification',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-invoice-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'drafted-invoice-notification',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-notification',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-notification',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-approval-notification',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-invoice-notification',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-invoice-notification',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-invoice-notification',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-bills-notification',
    parameter: '{{bill_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-bills-notification',
    parameter: '{{vendor_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'new-bills-notification',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-approval',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-approval',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-approval',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-approval',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-submission',
    parameter: '{{timesheet_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-submission',
    parameter: '{{display_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-submission',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'timesheet-pending-submission',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-pending-approval',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-pending-approval',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-pending-approval',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-pending-approval',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-drafted',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-drafted',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-drafted',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-drafted',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-due',
    parameter: '{{invoice_number}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-due',
    parameter: '{{invoice_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-due',
    parameter: '{{due_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'invoice-due',
    parameter: '{{client_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approval',
    parameter: '{{expense_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approval',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approval',
    parameter: '{{employee_id}}',
    created_at: new Date(),
  },
  {
    module_slug: 'expense-approval',
    parameter: '{{expense_date}}',
    created_at: new Date(),
  },
  {
    module_slug: 'document-expiry',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'employee-profile-approval',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'employee-e-verify',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'employee-personal-document',
    parameter: '{{employee_name}}',
    created_at: new Date(),
  },
  {
    module_slug: 'generate-payroll',
    parameter: '{{payroll_cycle}}',
    created_at: new Date(),
  },
  {
    module_slug: 'generate-payroll',
    parameter: '{{check_date}}',
    created_at: new Date(),
  }
];

const templateParametersSeed = async (tenant) => {
  await tenant('template_parameters').insert(templateParametersData);
};

module.exports = templateParametersSeed;