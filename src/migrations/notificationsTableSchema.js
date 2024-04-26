const notificationTablesSchema = async (tenant) => {

    await tenant.schema.createTable('notifications', (table) => {
        table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary().comment('id');
        table.integer('notification_slug_id').comment('slug');
        table.uuid('employee_id').comment('employee Id');
        table.text('content').comment('content');
        table.boolean('is_read').defaultTo(false).comment('is read or not');
        table.uuid('created_by').comment('record created employee id');
        table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('');
        table.uuid('updated_by').comment('record updated employee id');
        table.timestamp('updated_at').defaultTo(null).comment('');

    });
};
module.exports = notificationTablesSchema;
