//Default Write Off Reasons
const  writeOffData = [
  {
    write_off_reason: 'Bad Debts',
    description: 'Bad Debts',
    is_active: 1,
    is_editable: false,
    created_by: null,
    created_at: new Date()
  }
];

const writeOffDataSeed = async (tenant) => {
  await tenant('write_off').insert(writeOffData);
};

module.exports = writeOffDataSeed;