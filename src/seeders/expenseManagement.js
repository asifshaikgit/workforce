// Default Expense Types
const expenseManagementsData = [
  {
    name: 'Travel',
    description: 'Travel',
    referrable_type : 2,
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Training',
    description: 'Training',
    referrable_type : 2,
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Other',
    description: 'Other',
    referrable_type : 2,
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
];

const expenseManagementDataSeed = async (tenant) => {
  await tenant('expense_and_service_types').insert(expenseManagementsData);
};

module.exports = expenseManagementDataSeed;
