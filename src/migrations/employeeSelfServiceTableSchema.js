const employeeSelfServiceSchema = async (tenant) => {

    await tenant.schema
        .createTable('employee_self_services', (table) => { // Employee self service table
            table.uuid('id').defaultTo(tenant.raw('gen_random_uuid()')).primary()
            table.integer('self_service_types_id', 100).index().notNullable().comment('employee self service type Id')
            table.uuid('employee_id').index().comment('issue raised employee')
            table.string('reference_id', 50).index().notNullable().comment('employee self service reference id')
            table.string('subject', 255).notNullable().comment('employee self service subject')
            table.string('description').comment('employee self service description')
            table.date('raised_on').notNullable().comment('Issue raised on date')
            table.enu('status', ['Drafted', 'In Progress', 'Closed', 'Cancel', 'Reopen']).defaultTo('In Progress').notNullable();
            table.boolean('re_assigned').defaultTo(false).comment('if it is reassigned')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        .createTable('employee_self_service_documents', (table) => { // Self service documents
            table.increments().comment('Document ID');
            table.uuid('employee_self_service_id').comment('employee self service id').index().notNullable()
            table.string('document_name', 100).comment('Expense document name')
            table.tinyint('document_status').defaultTo(0).unsigned().notNullable().comment('0 - New, 1 - Rejected and 2 -Accepted')
            table.string('document_url').comment('time sheet document url')
            table.string('document_path').comment('Path of the uploaded document')
            table.boolean('aws_s3_status').index().defaultTo(false).comment('AWS uploaded status')
            table.uuid('created_by').comment('Record created employee id')
            table.uuid('updated_by').comment('Record updated employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
            table.timestamp('updated_at').defaultTo(tenant.fn.now()).comment('Record updated timestamp')
            table.timestamp('deleted_at').index().defaultTo(null).comment('Record deleted timestamp')
        })

        /**
        * To track the self service  changes
        */
        .createTable('employee_self_service_track', (table) => { // To track the employee self service activity/changes
            table.increments('id').primary().comment('self service Activity Track ID');
            table.uuid('employee_self_service_id').index().notNullable().comment('self service  id')
            table.tinyint('action_type').comment('1 for create, 2 for update , 3 for delete').unsigned().notNullable();
            table.uuid('created_by').notNullable().index().comment('Record created employee id')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        })

        .createTable('employee_self_service_fields_changes', (table) => {
            table.increments('id').primary().comment('self service  Fields Changes ID');
            table.integer('employee_self_service_track_id').comment('self service Activity Track ID');
            table.boolean('is_document_modified').comment('Is Document Modified');
            table.string('field_name', 50).comment('Field Name');
            table.string('old_value', 255).comment('Old Value');
            table.string('new_value', 255).comment('New Value');
        })

        /**
         * Employee self service chat activity.
         * Each employee self service will assign with multiple employee. So store the details whom needs to involve in this chat.
         */
        // .createTable('employee_self_service_chat_room', (table) => {
        //     table.increments()
        //     table.uuid('employee_id').comment('Room assigned employees.')
        //     table.uuid('room_id').comment('Room id is nothing but employee self service id. ')
        //     table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        //   });

        /**
       * Employee self service chat message.
       */
        .createTable('employee_self_service_chat_messages', (table) => {
            table.increments()
            table.uuid('employee_self_service_id').comment('Employee Self Service id is nothing but employee self service id.')
            table.uuid('employee_id').comment('message sender employee id')
            table.text('message').comment('Message that sends in the chat.')
            table.boolean('is_read').defaultTo(false).comment('If Message is read will make it as')
            table.text('attachment_url').comment('Message with attachment')
            table.timestamp('created_at').defaultTo(tenant.fn.now()).comment('Record Created timestamp')
        });
};

module.exports = employeeSelfServiceSchema;
