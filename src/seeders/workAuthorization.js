//Default Visa types
const workAuthorizationData = [
  {
    name: 'H-1B',
    description: 'H-1B',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'CPT',
    description: 'CPT',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'OPT',
    description: 'OPT',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'STEM-OPT',
    description: 'STEM-OPT',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Green Card',
    description: 'Green Card',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'US Citizen',
    description: 'US Citizen',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  }
];

const workAuthorizationDataSeed = async (tenant) => {
  await tenant('visa_types').insert(workAuthorizationData);
};

module.exports = workAuthorizationDataSeed;