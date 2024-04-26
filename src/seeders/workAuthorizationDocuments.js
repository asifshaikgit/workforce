
//Default creating workAuthorization and allocating workAuthorization documents to the defult workAuthorization
const workAuthorizationDocumentsDataSeed = async (tenant) => {

  let h1BDocuments = ['I797','i20']; //As per the documentation
  let cptDocuments = ['CPT','i20']; //As per the documentation
  let optDocuments = ['I983','i20']; //As per the documentation Same for both OPT and STEMOPT
  let gcDocuments = ['GC document','GC card']; //As per the documentation

  let workAuthorizationData = await tenant('visa_types')
    .select('*')
    .whereNull('deleted_at');

  if (workAuthorizationData.length > 0) {

    /* Using Map to iterate the loop and prepare the response */
    await workAuthorizationData.map(async (item) => {
      if (item.name == 'H-1B') {
        await h1BDocuments.map(async (saPer) => {
          createObject = {
            name: saPer,
            visa_type_id: item.id,
            is_active: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('visa_document_types').insert(createObject);
        });
      } else if (item.name == 'CPT') {
        await cptDocuments.map(async (hrPer) => {
          createObject = {
            name: hrPer,
            visa_type_id: item.id,
            is_active: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('visa_document_types').insert(createObject);
        });
      } else if (item.name == 'OPT') {
        await optDocuments.map(async (opt) => {
          createObject = {
            name: opt,
            visa_type_id: item.id,
            is_active: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('visa_document_types').insert(createObject);
        });
      } else if (item.name == 'STEM-OPT') {
        await optDocuments.map(async (opt) => {
          createObject = {
            name: opt,
            visa_type_id: item.id,
            is_active: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('visa_document_types').insert(createObject);
        });
      } else if (item.name == 'Green Card') {
        await gcDocuments.map(async (gc) => {
          createObject = {
            name: gc,
            visa_type_id: item.id,
            is_active: true,
            is_editable: false,
            created_at: new Date(),
          };
          await tenant('visa_document_types').insert(createObject);
        });
      }
    });
    /* Using Map to iterate the loop and prepare the response */
  }
};

module.exports = workAuthorizationDocumentsDataSeed;
