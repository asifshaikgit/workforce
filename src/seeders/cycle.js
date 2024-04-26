// Default cycles used for timesheet and invoices

const cycleData = [
  {
    id: 1,
    name: 'Weekly',
    slug: 'weekly',
    description: 'Weekly cycle',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'Bi-Weekly',
    slug: 'bi_weekly',
    description: 'Weekly cycle',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'Semi Monthly',
    slug: 'semi_monthly',
    description: 'Semi Monthly cycle',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Monthly',
    slug: 'monthly',
    description: 'Monthly cycle',
    is_editable: false,
    created_at: new Date(),
  },
  {
    id: 5,
    name: 'Configurable',
    slug: 'configurable',
    description: 'Configurable cycles',
    is_editable: false,
    created_at: new Date(),
  },
];

const cycleDataSeed = async (tenant) => {
  await tenant('cycles').insert(cycleData);
};

module.exports = cycleDataSeed;