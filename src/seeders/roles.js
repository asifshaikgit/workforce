//Default Roles
const rolesData = [
  {
    name: 'Super Admin',
    description: 'Super Admin Related Permissions',
    is_active : true,
    is_editable: false,
    created_at: new Date(),
  },
  {
    name: 'HR Admin',
    description: 'Hr Admin Role Related Permissions',
    is_active : true,
    is_editable: false,
    created_at: new Date(),
  },
  {
    name: 'Payroll Admin',
    description: 'Payroll Admin Role Related Permissions',
    is_active : true,
    is_editable: false,
    created_at: new Date(),
  },
  {
    name: 'Accounts Admin',
    description: 'Accounts Admin Related Permissions',
    is_active : true,
    is_editable: false,
    created_at: new Date(),
  },
];

const rolesDataSeed = async (tenant) => {
  await tenant('roles').insert(rolesData);
};

module.exports = rolesDataSeed;