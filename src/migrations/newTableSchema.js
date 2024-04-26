const newTableSchema = async (tenant) => {

    await tenant.schema
      .createTable('announcements', (table) => { // Announcements Detail;s
        table.increments().comment('Announcement ID')
        table.tinyint('expression_type').index().notNullable().comment('1-Web, 2 - Mobile')
        table.string('document_name', 255).comment('name of the uploaded document')
        table.string('document_url').comment('Document URL path')
        table.string('aws_s3_key').comment('Path of the uploaded document')
        table.tinyint('aws_s3_status').defaultTo(0).comment('0 for New, 1 for Pushed to AWS, 2 for Error')
        table.date('publish_date').index().comment('Publish date')
        table.uuid('created_by').comment('Record created employee id')
        table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
    })
    console.log("Created")
  }
  
  module.exports = newTableSchema;
  