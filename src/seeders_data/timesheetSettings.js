const newTimesheetSettings = [
  {
    name: 'Display Working Hours for the Standard Time',
    description: 'Enable to display default working hours of the company for the workday Note : Value will be zero if disabled',
    slug: 'def_work_hours',
    is_active: 0,
  },
  {
    name: 'Vacation Time Off',
    description: 'Enable to display Vacation Time Off option in the Timesheets Module',
    slug: 'vac_time_off',
    is_active: 0,
  },
  {
    name: 'Approver can Edit the Timesheet',
    description: 'Enabled to allow the approver to edit timesheets submitted for approval',
    slug: 'approver_ts_edit',
    is_active: 0,
  },
  {
    name: 'Display Job Details',
    description: 'Enable to show Project Name, Billable Client, End Client, Job Start Date, Job End Date & Approval Flow while submitting timesheets, viewing timesheets and on timesheet PDF generation',
    slug: 'disply_job_detail',
    is_active: 0,
  },
  {
    name: 'Custom Timesheet Task(s)',
    description: 'Enable to allow users to select tasks while submitting timesheets',
    slug: 'approver_ts_edit',
    is_active: 0,
  },
  {
    name: 'Allow Submitting Past Timesheets Timesheets if are Due',
    description: 'Enable to allow the employees to submit timesheets even if the employee has due timesheets for the placement',
    slug: 'allow_sub_ts_past_due',
    is_active: 0,
  },
  {
    name: 'Can Submit Future Timesheets',
    description: 'Enable to allow employees to submit timesheets for Future Timesheet cycles',
    slug: 'can_submit_futr_ts',
    is_active: 0,
  }, {
    name: 'Future Timesheets Current Cycle',
    description: 'Enable to allow employees of submission timesheets with current cycle if disabled submission with current Date',
    slug: 'futr_ts_crnt_cycle',
    is_active: 0,
  },
  {
    name: 'Capture Approval Comments',
    description: 'Enable to allow comments during approval',
    slug: 'capture_approval_comm',
    is_active: 0,
  },
  {
    name: 'Show Billable Clients While Submitting Timesheets',
    description: 'Enable to display Billable Client to the user instead of End Cient',
    slug: 'show_billable_client_while_subing_ts',
    is_active: 0,
  },
  {
    name: 'Class',
    description: 'Enable to display the Class field in Timesheets',
    slug: 'class',
    is_active: 0,
  },
  {
    name: 'Custom Field',
    description: 'Enable to add a custom field in timesheets',
    slug: 'custom_field',
    is_active: 0,
  },
  {
    name: 'Cell Level Billabilty',
    description: 'Enable to decide billabibty for tasks (for each cell entry) in Timesheets Note: Users can override billing terms of Pay',
    slug: 'cell_level_billability',
    is_active: 0,
  },
  {
    name: 'Time Off Detailed View',
    description: 'Enable to display the time off details applied through Absence Management in the Timesheets',
    slug: 'time_off_detail_view',
    is_active: 0,
  },
  {
    name: 'Enable Client Approval Status field',
    description: 'Enable to display the Client Approval Status field in the Timesheets',
    slug: 'enable_client_apprvl_status_field',
    is_active: 0,
  },
  {
    name: 'Allow Submitting Timesheets More Than 24 Hours.',
    description: 'Enable to submit more than 24 hours timesheets for multiple placements per day',
    slug: 'allow_submit_ts_more_than_24hr',
    is_active: 0,
  },
  {
    name: 'Digital Signature',
    description: 'Enable to capture the Signature of Employee while submitting the Timesheet, this option wil be available for Regular Timesheets, Timesheet with Time clock, Bulk Timeshests and Timer Timesheets.',
    slug: 'digital_signature',
    is_active: 0,
  },
  {
    name: 'Automatically stop timer after Working Hours',
    description: 'Enable to stop the timer after working hours for the day are completed, This feature will work only when the auto distriouton is not enabled in the placement for which Timer timesheet is being submitted',
    slug: 'digital_signature',
    is_active: 0,
  },
];

module.exports = { newTimesheetSettings };