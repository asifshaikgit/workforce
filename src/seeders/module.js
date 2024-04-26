/* Dont edit the information. Major modules in the application */
const moduleData = [
  {
    id: 1,
    name: 'Employee',
    description: 'Employee Module',
  },
  {
    id: 2,
    name: 'Client',
    description: 'Client Module',
  },

  {
    id: 3,
    name: 'End Client',
    description: 'End Client Module',
  },

  {
    id: 4,
    name: 'Placement',
    description: 'Placement Module',
  },

  {
    id: 5,
    name: 'Time Sheet',
    description: 'Time Sheet Module',
  },
  {
    id: 6,
    name: 'Invoices',
    description: 'Invoices Module',
  },
  {
    id: 7,
    name: 'Employee Self Service',
    description: 'Employee Self Service Module',
  },
  {
    id: 8,
    name: 'Expense Management',
    description: 'Expense Management Module',
  },
  {
    id: 9,
    name: 'Bills',
    description: 'Bills Module',
  },
  {
    id: 10,
    name: 'Invoice Payments',
    description: 'Invoice Payments Module',
  },
  {
    id: 11,
    name: 'Dashboard',
    description: 'Dashboard Module',
  },
  {
    id: 12,
    name: 'Configurations',
    description: 'Configurations Module',
  },
  {
    id: 13,
    name: 'Payroll',
    description: 'Payroll Module',
  },
  {
    id: 14,
    name: 'Balance Sheet',
    description: 'Balance Sheet Module',
  },
  {
    id: 15,
    name: 'Vendor',
    description: 'Vendor Module',
  },
  {
    id: 16,
    name: 'Bill Payments',
    description: 'Bill Payments Module',
  },
];

const moduleDataSeed = async (tenant) => {
  await tenant('modules').insert(moduleData);
};

module.exports = moduleDataSeed;