const newInvoiceSettings =[ 
  {
    name: 'Default Timesheets/Expenses Attachment',
    description: 'Enable to add TimeSheet Doc/Screenshot attachments to invoices by default',
    slug: 'default_ts',
    is_active: 0,
  },
  {
    name: 'Attach Placement Purchase Order',
    description: 'Enable to add purchase order to invoices by default',
    slug: 'attach_placement_po',
    is_active: 0,
  },
  {
    name: 'Display Invoice Shipped Date',
    description: 'Enable to display the \'invoice shipped\' date on the invoice PDF',
    slug: 'display_inv_shipped_date',
    is_active: 0,
  },
  {
    name: 'Display Payable To',
    description: 'Enable to display the \'Payable To\' date on the invoice PDF',
    slug: 'display_payable_to',
    is_active: 0,
  },
  {
    name: 'Class',
    description: 'Enable to display the Class field on invoices and sync Class data with QuickBooks',
    slug: 'class',
    is_active: 0,
  },
  {
    name: 'Department',
    description: 'Enable to display the Department field on invoice and sync Department data with QuickBooks',
    slug: 'department',
    is_active: 0,
  },
  {
    name: 'Change Notification Details',
    description: 'Enable to email selected users when an invoice is edited',
    slug: 'change_notification_details',
    is_active: 0,
  },
  {
    name: 'Invoice Submission Approval Flow',
    description: 'Enable to set an Approval Flow for all invoices after creation; the default is configured here but client Specific flows can be set at the client level',
    slug: 'inv_submission_approval_flow',
    is_active: 0,
  },
  {
    name: 'Invoice Email Tracking',
    description: 'Enable to track invoice email delivery and read receipts of emails sent using CEIPAL',
    slug: 'inv_email_track',
    is_active: 0,
  },
  {
    name: 'Include Invoice PDF Attachment',
    description: 'Enable to include invoice PDF as an attachment to emails',
    slug: 'include_inv_pdf_attach',
    is_active: 0,
  },
  {
    name: 'Include Timesheet & Expense PDFs',
    description: 'Enable to include CEIPAL timesheet and expense PDFs in the invoice PDF',
    slug: 'include_ts_expenses_pdfs',
    is_active: 0,
  },
  {
    name: 'Invoice Actions from Email',
    description: 'Enable to show the \'Accept\' and \'Reject\' buttons in the invoice email',
    slug: 'inv_actions_from_email',
    is_active: 0,
  },
  {
    name: 'Include Timesheet Attachment in Invoice Email',
    description: 'Enable to merge all timesheet attachments into a single document attached to the email Note : This functionality will apply for raised invoices for a single employee so long as the combined size does not exceed 25MB',
    slug: 'include_ts_attach_in_inv_email',
    is_active: 0,
  },
  {
    name: 'Capture Discounts at Line Item',
    description: 'If enabled discounts column will be available at each line item level in the Invoice.',
    slug: 'captr_discts_at_line_item',
    is_active: 0,
  },
  {
    name: 'Invoice Submissions',
    description: 'Enable to Submit the invoices to clients with email if it is disabled users can only save the invoices but can not submit along with Email',
    slug: 'inv_submissions',
    is_active: 0,
  },
];

module.exports = { newInvoiceSettings };