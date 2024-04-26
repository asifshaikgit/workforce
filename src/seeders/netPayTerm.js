// Deafult Net Payterms
const  netPayTermData = [
  {
    days: 7,
    description: 'Weekly',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    days: 14,
    description: 'Bi-Weekly',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    days: 21,
    description: '3 weeks once',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
];

const netPayTermDataSeed = async (tenant) => {
  await tenant('net_pay_terms').insert(netPayTermData);
};
module.exports = netPayTermDataSeed;
