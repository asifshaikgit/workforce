// Fixed employment types for this application
const employmentData = [
  {
    name: 'Internal Employee',
    description: 'Internal Employee Employment Type and they are not allowed to edit.',
    is_active : true,
    created_at: new Date(),
    created_by : null,
  },
  {
    name: 'Consultant',
    description: 'Consultant Employment Type and they are not allowed to edit.',
    is_active : true,
    created_at: new Date(),
    created_by : null,
  },
  {
    name: 'Contractor',
    description: 'Contractor Employment Type and they are not allowed to edit.',
    is_active : true,
    created_at: new Date(),
    created_by : null,
  },
];

const employementDataSeed = async (tenant) => {
  await tenant('employment_types').insert(employmentData);
};

module.exports = employementDataSeed;