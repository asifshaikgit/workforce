const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');
const indexRepository = require('../src/v1/user/repositories/index')
const moment = require('moment')

event.on('paymentUpdateActivity', async (data) => {
    // getting the date format 
    dateFormat = await indexRepository.find('organization', ['date_format'])
    format = dateFormat.data[0].date_format

    // getting before data
    before = data.beforeData.data[0]
    before["Received on"] = moment(before["Received on"]).format(format)

    // getting after data
    after = data.afterData.data[0]
    after["Received on"] = moment(after["Received on"]).format(format)

    // setting to the desired date format

    // pre requisite data before inserting the real activity
    activityData = `Payment ${data.activity.reference_id} has been updated - `

    if (JSON.stringify(before) !== JSON.stringify(after)) {
        for (const key in after) {

            if (key != 'created_at' && key != 'updated_at' && key != 'deleted_at' && key != 'created_by' && key != 'updated_by' && key != 'create_emp' && key != 'update_emp' && key != 'documents' && key != 'Document name' && key != 'isDocumentStore' && key != 'isDocumentUpdate' && key != 'isDocumentDelete' && key != 'client_name' && key != 'reference_id' && key != 'payment_invoices') {

                before[key] = before[key] != '' ? before[key] : '-'
                after[key] = after[key] != '' ? after[key] : '-'
                if (before[key] != after[key]) {
                    var fieldData = `${key} has been changed from ${before[key]} to ${after[key]} , `
                    activityData += fieldData
                }
                //to check the document is updated
            } else if (key == 'payment_invoices') {
                for (let keys in after['payment_invoices']) {
                    for (let keyss in after['payment_invoices'][keys]) {
                        if (after['payment_invoices'][keys][keyss] !== before['payment_invoices'][keys][keyss]) {
                            before['payment_invoices'][keys][keyss] = before['payment_invoices'][keys][keyss] != '' ? before['payment_invoices'][keys][keyss] : null
                            if (keyss != 'reference_id') {
                                var fieldData = `${keyss} has been changed from ${before['payment_invoices'][keys][keyss]} to ${after['payment_invoices'][keys][keyss]} for the invoice ${after['payment_invoices'][keys]['reference_id']} , `
                                activityData += fieldData
                            }
                        }
                    }
                }
                //to check the document is stored
            } else if (key == 'isDocumentUpdate') {
                if (before[key] != after[key]) {
                    var fieldData = ` Document has been reuploaded , `
                    activityData += fieldData
                }
                //to check the document is stored
            } else if (key == 'isDocumentStore') {
                if (before[key] != after[key]) {
                    var fieldData = ` New Document has been uploaded  , `
                    activityData += fieldData
                }
            }
            //to check the document is deleted
            else if (key == 'isDocumentDelete') {
                if (before[key] != after[key]) {
                    var fieldData = ` Document has been deleted  , `
                    activityData += fieldData
                }
            }
        }
    }
    //slicing the last spaces and commas
    activityData = activityData.slice(0, -2)

    // object to insert
    var fieldData = {
        referrable_id: data.activity.payment_id,
        referrable_type: 'invoice-payments',
        referrable_sub_type: null,      
        action_type: data.activity.action_type,
        activity: activityData,
        created_at: new Date(),
        created_by: data.activity.updated_by,
    };
    // object to insert

    // storing in the db
    if (activityData.length > 0) {
        const db = await getConnection();
        await db('activity_track').insert(fieldData);
    }
});

event.on('paymentStoreActivity', async (data) => {

    // message to be inserted
    var activityData = `Payment ${data.activity.reference_id} has been logged for the client ${data.activity.client_name}`

    // object to insert
    var fieldData = {
        referrable_id: data.activity.payment_id,
        referrable_type: 'invoice-payments',
        referrable_sub_type: null,
        action_type: data.activity.action_type,
        activity: activityData,
        created_at: new Date(),
        created_by: data.activity.created_by,
    };

    // storing in the db
    if (activityData.length > 0) {
        const db = await getConnection();
        await db('activity_track').insert(fieldData);
    }
});

module.exports = { event };