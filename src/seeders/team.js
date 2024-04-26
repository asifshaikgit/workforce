
const teamsDataSeed = async (tenant) => {

  let departmentData = await tenant('departments as d').select('d.*').whereNull('d.deleted_at'); // Fetch the default departments

  if (departmentData.length > 0) {

    /* Using Map to iterate the loop and prepare the response */
    await departmentData.map(async (item) => {
      if (item.name == 'Admin') {
        createObject = {
          department_id: item.id,
          name: 'Admin',
          description: 'Admin Team',
          is_active: true,
          is_editable: false,
          created_at: new Date(),
        };
        await tenant('teams').insert(createObject);
      } else if (item.name == 'HR') {
        createObject = {
          department_id: item.id,
          name: 'HR',
          description: 'HR Team',
          is_active: true,
          is_editable: false,
          created_at: new Date(),
        };
        await tenant('teams').insert(createObject);
      } else if (item.name == 'Accounts') {
        createObject = {
          department_id: item.id,
          name: 'Accounts',
          description: 'Accounts Team',
          is_active: true,
          is_editable: false,
          created_at: new Date(),
        };
        await tenant('teams').insert(createObject);
      }
    });
    /* Using Map to iterate the loop and prepare the response */
  }
};

module.exports = teamsDataSeed;
