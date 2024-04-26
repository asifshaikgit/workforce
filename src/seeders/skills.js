//Default skill types
const  skillsData = [
  {
    name: 'Java',
    description: 'Java',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'PHP',
    description: 'PHP',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'DOT NET',
    description: 'DOT NET',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'React JS',
    description: 'React JS',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Node JS',
    description: 'Node JS',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
  {
    name: 'Angular',
    description: 'Angular',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  }  
];

const skillDataSeed = async (tenant) => {
  await tenant('skills').insert(skillsData);
};

module.exports = skillDataSeed;