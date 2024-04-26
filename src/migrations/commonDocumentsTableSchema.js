
const commonDocumentsTableSchema = async (tenant) => {

  await tenant.schema
    .createTable('temp_upload_documents', (table) => { // Temporary store the uploaded documents. Using cron to delete 1 day old entries
      table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
      table.string('document_name', 255).comment('Name of the document')
      table.string('document_url').comment('URL to access the document')
      table.string('document_path').comment('Path of the document stored')
      table.timestamp('created_at').defaultTo(tenant.fn.now())
    })
};

module.exports = commonDocumentsTableSchema;