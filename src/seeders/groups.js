// Default Group
const groupsList = [
  {
    name: 'Admin',
    is_active: true,
  },
];

const groupsDataSeed = async (tenant) => {
  await tenant('groups').insert(groupsList);
};

module.exports = groupsDataSeed;