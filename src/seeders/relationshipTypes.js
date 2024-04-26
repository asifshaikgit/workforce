//Default relationshipTypes
const relationshipTypesData = [
    {
        name: 'Father',
        description: 'relation to the employee',
        is_active: true,
        is_editable: false,
        created_at: new Date(),
    },
    {
        name: 'Mother',
        description: 'relation to the employee',
        is_active: true,
        is_editable: false,
        created_at: new Date(),
    },
    {
        name: 'Spouse',
        description: 'relation to the employee',
        is_active: true,
        is_editable: false,
        created_at: new Date(),
    },
    {
        name: 'Son',
        description: 'relation to the employee',
        is_active: true,
        is_editable: false,
        created_at: new Date(),
    },
    {
        name: 'Daughter',
        description: 'relation to the employee',
        is_active: true,
        is_editable: false,
        created_at: new Date(),
    }

];

const relationshipTypesDataDataSeed = async (tenant) => {
    await tenant('relationship_types').insert(relationshipTypesData);
};

module.exports = relationshipTypesDataDataSeed;