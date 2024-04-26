// Default pefix values
const prefixesData = [
  {
    name: 'Employee',
    slug: 'employee',
    prefix_name: 'EMP',
    separator: '-',
    number: 1,
    description: 'Internal employee prefixes',
    created_at: new Date(),
  },
  {
    name: 'Consultant/Contractor',
    slug: 'consultant-contractor',
    prefix_name: 'CON',
    separator: '-',
    number: 1,
    description: 'Consultant/Contractor employee prefixes',
    created_at: new Date(),
  },
  {
    name: 'Invoice',
    slug: 'invoice',
    prefix_name: 'INV',
    separator: '-',
    number: 1,
    description: 'Invoices prefixes',
    created_at: new Date(),
  },
  {
    name: 'Client',
    slug: 'client',
    prefix_name: 'CLT',
    separator: '-',
    number: 1,
    description: 'Client prefixes',
    created_at: new Date(),
  },
  {
    name: 'End-Client',
    slug: 'end-client',
    prefix_name: 'E-CLT',
    separator: '-',
    number: 1,
    description: 'End Client prefixes',
    created_at: new Date(),
  },
  {
    name: 'Vendor',
    slug: 'vendor',
    prefix_name: 'VEN',
    separator: '-',
    number: 1,
    description: 'Vendor prefixes',
    created_at: new Date(),
  },
  {
    name: 'Expenses',
    slug: 'expense',
    prefix_name: 'EXP',
    separator: '-',
    number: 1,
    description: 'Expenses prefixes',
    created_at: new Date(),
  },
  {
    name: 'Employee Self Service',
    slug: 'employee-self-service',
    prefix_name: 'EMPS',
    separator: '-',
    number: 1,
    description: 'Employee Self Service prefixes',
    created_at: new Date(),
  },
  {
    name: 'Payments',
    slug: 'payment',
    prefix_name: 'PAY',
    separator: '-',
    number: 1,
    description: 'Payments prefixes',
    created_at: new Date(),
  },
  {
    name: 'Bills',
    slug: 'bill',
    prefix_name: 'BILL',
    separator: '-',
    number: 1,
    description: 'Bill prefixes',
    created_at: new Date(),
  },
  {
    name: 'Time Sheet',
    slug: 'timesheet',
    prefix_name: 'TS',
    separator: '-',
    number: 1,
    description: 'Bill prefixes',
    created_at: new Date(),
  },
  {
    name: 'Placements',
    slug: 'placement',
    prefix_name: 'PLS',
    separator: '-',
    number: 1,
    description: 'Placement Prefix',
    created_at: new Date(),
  },

  {
    name: 'Bill Payments',
    slug: 'bill-payment',
    prefix_name: 'BP',
    separator: '-',
    number: 1,
    description: 'Bill Payments Prefix',
    created_at: new Date(),
  },
  {
    name: 'work Authorization',
    slug: 'work-authorization',
    prefix_name: 'WA',
    separator: '-',
    number: 1,
    description: 'Work Authorization Prefix',
    created_at: new Date()
  }

];

const prefixesDataSeed = async (tenant) => {
  await tenant('prefixes').insert(prefixesData);
};

module.exports = prefixesDataSeed;