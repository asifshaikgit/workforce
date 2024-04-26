// Default departments
const departmentsData = [
  {
    name: 'Admin',
    is_active: true,
    is_editable: false,
    description: 'Who has complete access to the application',
    created_at: new Date(),
    created_by : null,
  },
  {
    name: 'HR',
    is_active: true,
    is_editable: false,
    description: 'Accounts Department. Who will handle the employee related things',
    created_at: new Date(),
    created_by : null,
  },
  {
    name: 'Accounts',
    is_active: true,
    is_editable: false,
    description: 'Accounts Department. Who will handle the account related things',
    created_at: new Date(),
    created_by : null,
  },
    
];

const departmentDataSeed = async (tenant) => {
  await tenant('departments').insert(departmentsData);
};

module.exports = departmentDataSeed;