//Default Notifications config types
const notificationSettingsModules = [
  {
    name: 'Consultant Invitation',
    slug: 'consultant-invitation-notification',  // sent a notification when aconsultant ius invited.
    template: '{{full_name}} has been successfully invited to the organization.',
  },
  {
    name: 'Birthdays',
    slug: 'birthdays-notification',  // sent a notification when employee birthday
    template : 'Today is {{full_name}} birthday. Wish them a great year ahead'
  },
  {
    name: 'Placement Expiry',
    slug: 'placement-expiry-notification', // sent a notification when a placement is goimg to end
    template : 'Placement for {{full_name}} with {{employee_id}} working for {{client_name}} with ID {{placement_id}} has expired. '
  },
  {
    name: 'Draft Timesheets',
    slug: 'drafted-timesheet-notification',  // sent a notification when an timesheet is raised automatically
    template : 'Timesheet {{timesheet_number}} has been drafted for {{full_name}} with {{employee_id}} with {{client_name}} from {{from_date}} to {{to_date}}.' 
  },
  {
    name: 'Timesheet Approval',
    slug: 'timesheet-approval-notification',  // sent a notification when an timesheet should be approved
    template : '{{timesheet_number}} for {{full_name}} with {{employee_id}} working with {{client_name}} is pending for approval '
  },
  {
    name: 'Draft Invoices',
    slug: 'drafted-invoice-notification', // sent a notification when an invoice is raised automatically
    template : '{{invoice_number}} has been drafted for {{client_name}} on {{invoice_date}}'
  },
  {
    name: 'Invoice Approval',
    slug: 'invoice-approval-notification', // sent a notification when an invoice to be approved
    template : '{{invoice_number}} for {{client_name}} on {{invoice_date}} with due date of {{due_date}} has been approved '
  },
  {
    name: 'Invoice',
    slug: 'new-invoice-notification',  // sent a notification when a invoice is raised manually.
    template : '{{invoice_number}} has been submitted for {{client_name}}'
  },
  {
    name: 'Bills',
    slug: 'new-bills-notification',  // sent a notification when a bill has been raised manually.
    template : '{{bill_number}} for {{vendor_name}} with due date of {{due_date}} has been drafted'
  },
];

const notiifcationSettingsDataSeed = async (tenant) => {
  await tenant('notification_settings').insert(notificationSettingsModules);
};

module.exports = notiifcationSettingsDataSeed;