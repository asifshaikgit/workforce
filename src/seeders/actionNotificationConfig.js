// Default referrable_type - Action Slug Insertion
const defaultActionSlugs = [
    {
        slug: 'timesheet-approved',
        name: 'Timesheet Approved',
        referrable_type: 'action'
    },
    {
        slug: 'invoice-approved',
        name: 'Invoice Approved',
        referrable_type: 'action'
    },
    {
        slug: 'invoice-drafted',
        name: 'Invoice Drafted',
        referrable_type: 'action'
    },
    {
        slug: 'expense-received',
        name: 'Expense Received',
        referrable_type: 'action'
    },
    {
        slug: 'payroll-drafted',
        name: 'Payroll Drafted',
        referrable_type: 'action'
    },
    {
        slug: 'consultatnt-invitation-submit',
        name: 'Consultatnt Invitation Submit',
        referrable_type: 'action'
    },
    {
        slug: 'personal-documents-expiry',
        name: 'Personal Documents Expiry',
        referrable_type: 'action'
    },
    {
        slug: 'work-authorization-documents-expiry',
        name: 'Work Authorization Documents Expiry',
        referrable_type: 'action'
    },
    {
        slug: 'invoice-due-date',
        name: 'Invoice Due Date',
        referrable_type: 'action'
    },
    {
        slug: 'bill-due-date',
        name: 'Bill Due Date',
        referrable_type: 'action'
    }
];

// Default referrable_type - Notification slug Insertion
const defaultNotificationSlugs = [
    {
        slug: 'invoice-due-date',
        name: 'Invoice Due Date',
        referrable_type: 'notification'
    },
    {
        slug: 'bill-due-date',
        name: 'Bill Due Date',
        referrable_type: 'notification'
    },
    {
        slug: 'birthdays',
        name: 'Birthdays',
        referrable_type: 'notification'
    },
    {
        slug: 'consultatnt-invitation-submit',
        name: 'Consultatnt Invitation Submit',
        referrable_type: 'notification'
    },
    {
        slug: 'placement-expiry',
        name: 'Placement Expiry',
        referrable_type: 'notification'
    },
    {
        slug: 'work-authorization-documents-expiry',
        name: 'Work Authorization Documents Expiry',
        referrable_type: 'notification'
    },
    {
        slug: 'personal-documents-expiry',
        name: 'Personal Documents Expiry',
        referrable_type: 'notification'
    },
    {
        slug: 'expense-received',
        name: 'Expense Received',
        referrable_type: 'notification'
    },
    {
        slug: 'payroll-submit',
        name: 'Payroll Submit',
        referrable_type: 'notification'
    }
];

const actionNotificationSeed = async (tenant) => {
    await tenant('action_notification_config').insert(defaultActionSlugs);
    await tenant('action_notification_config').insert(defaultNotificationSlugs);
};

module.exports = actionNotificationSeed

