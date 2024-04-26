//Default reminderConfiguration
const reminderConfigurationData = [
    {
        name: 'Timesheet Pending Approval',
        slug: 'timesheet-pending-approval',
        referrable_type: 'timesheet',
        created_at: new Date(),
    },
    {
        name: 'Timesheet Pending Submission',
        slug: 'timesheet-pending-submission',
        referrable_type: 'timesheet',
        created_at: new Date(),
    },
    {
        name: 'Invoice Pending Approval',
        slug: 'invoice-pending-approval',
        referrable_type: 'invoice',
        created_at: new Date(),
    },
    {
        name: 'Invoice Drafted',
        slug: 'invoice-drafted',
        referrable_type: 'invoice',
        created_at: new Date(),
    },
    {
        name: 'Invoice Due',
        slug: 'invoice-due',
        referrable_type: 'invoice',
        created_at: new Date(),
    },
    {
        name: 'Expense Approval',
        slug: 'expense-approval',
        referrable_type: 'expense-management',
        created_at: new Date(),
    },
    {
        name: 'Document Expiry',
        slug: 'document-expiry',
        referrable_type: 'immigration',
        created_at: new Date(),
    },
    {
        name: 'Employee Profile Approval',
        slug: 'employee-profile-approval',
        referrable_type: 'employee',
        created_at: new Date(),
    },
    {   
        name: 'E Verify',
        slug: 'employee-e-verify',
        referrable_type: 'employee',
        created_at: new Date(),
    },
    {
        name: 'Employee Personal Documents',
        slug: 'employee-personal-document',
        referrable_type: 'employee',
        created_at: new Date(),
    },
    {
        name: 'Generate Payroll',
        slug: 'generate-payroll',
        referrable_type: 'payroll',
        created_at: new Date(),
    }
];

const reminderConfigurationDataSeed = async (tenant) => {
    await tenant('reminder_configurations').insert(reminderConfigurationData);
};

module.exports = reminderConfigurationDataSeed;