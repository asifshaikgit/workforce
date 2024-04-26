// Default creating employee categories
const employeeCategoriesSeed = async (tenant) => {

  let employmentData = await tenant('employment_types').select('id','name').whereNull('deleted_at');
  
  if (employmentData.length > 0) {

    /* Using Map to iterate the loop and prepare the response */
    await employmentData.map(async (item) => {
      if(item.name == 'Consultant' ){
        createObject = {
          employment_type_id: item.id,
          name : 'W2',
          description : 'W2 Consultants',
          is_active : true,
          is_editable: false,
          created_by : null,
          created_at: new Date(),
        };
        await tenant('employee_categories').insert(createObject);
        createObject = {
          employment_type_id: item.id,
          name : '1099',
          description : '1099 Consultants',
          is_active : true,
          is_editable: false,
          created_by : null,
          created_at: new Date(),
        };
        await tenant('employee_categories').insert(createObject);
      }else if(item.name == 'Contractor' ){
        createObject = {
          employment_type_id: item.id,
          name : 'W2',
          description : 'W2 Contractors',
          is_active : true,
          is_editable: false,
          created_by : null,
          created_at: new Date(),
        };
        await tenant('employee_categories').insert(createObject);
        createObject = {
          employment_type_id: item.id,
          name : 'Independent',
          description : 'Independent Contractors',
          is_active : true,
          is_editable: false,
          created_by : null,
          created_at: new Date(),
        };
        await tenant('employee_categories').insert(createObject);
      }
      // As per New Requirement Internal Employee doesn't have any categories
      /*else if(item.name == 'Internal Employee' ){
        createObject = {
          employment_type_id: item.id,
          name : 'Internal Employee',
          description : 'Internal Organization Employee',
          is_active : true,
          is_editable: false,
          created_by : null,
          created_at: new Date(),
        };
        await tenant('employee_categories').insert(createObject);
      }*/
    });
    /* Using Map to iterate the loop and prepare the response */
  } 
};

module.exports = employeeCategoriesSeed;
