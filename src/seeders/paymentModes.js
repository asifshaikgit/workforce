//Default payment mode types
const  paymentModesData = [
  {
    name: 'DD',
    description: 'Demand Draft',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Cheque',
    description: 'Cheque',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Online Transfer',
    description: 'Online Transfer',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  }
];

const paymentModesDataSeed = async (tenant) => {
  await tenant('payment_modes').insert(paymentModesData);
};
module.exports = paymentModesDataSeed;
