const remindersTableSchema = async (tenant) => {

  await tenant.schema
    .createTable('reminders', (table) => { // Table schema that reminders
      table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary().comment('id');
      table.integer('reminder_slug_id').comment('slug')
      table.uuid('employee_id').comment('employee Id');
      table.text('template').comment('content');
      table.jsonb('redirection_info').comment('redirect information');
      table.boolean('is_read').defaultTo(false).comment('is read or not');
      table.uuid('created_by').comment('record created employee id');
      table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('');
      table.timestamp('actioned_at').defaultTo(tenant.fn.now()).comment('');
      table.enu('status', ['Pending', 'Completed', 'Stop']).defaultTo('Pending').notNullable();
      table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp');
    })

}

module.exports = remindersTableSchema;