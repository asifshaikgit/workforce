// Default education levels
const  educationLevelsData = [
  {
    name: 'Masters',
    description: 'Masters',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },
  {
    name: 'Bachelours',
    description: 'Bachelours',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },
];

const educationLevelsDataSeed = async (tenant) => {
  await tenant('education_levels').insert(educationLevelsData);
};
module.exports = educationLevelsDataSeed;
