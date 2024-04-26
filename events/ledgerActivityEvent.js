const EventEmitter = require('events');
const events = new EventEmitter();
const indexRepository = require('../src/v1/user/repositories/index');
const { toTitleCase } = require('../helpers/globalHelper');
const moment = require('moment');
const format = require('../helpers/format')

/**
 * Ledger Activity Track - common for store, update, delete.
 */
events.on('ledgerActivity', async (data) => {

    let dateFormat = await format.getDateFormat(); // date format

    data = data.activity;

    // create an object 'ledgerActivityTrack' and insert in 'expense_activity_track' table.
    let ledgerActivityTrack = {
        ledger_id: data?.ledger_id,
        action_type: data?.action_type,
        created_by: data?.created_by
    }

    const ledgerActivityData = await indexRepository.store('ledger_activity_track', ledgerActivityTrack);

    // create records in 'ledger_fields_changes' table if any changes in field values
    if (data?.action_type == 2 && data?.beforeUpdate) {

        const beforeUpdate = data?.beforeUpdate;

        // Get Latest Changes made in ledger
        let afterUpdate = await indexRepository.rawQuery(data?.query);
        afterUpdate = afterUpdate[0];

        // update the changes in ledgersData if any
        for (const key in beforeUpdate) {

            if (key == 'ledger_item_details' && beforeUpdate.hasOwnProperty('ledger_item_details') && afterUpdate.hasOwnProperty('ledger_item_details')) {

                // update changes in the ledger_item_details
                const beforeLedgerItemDetails = beforeUpdate.ledger_item_details;
                const afterLedgerItemDetails = afterUpdate.ledger_item_details;

                // loop before ledger items
                await Promise.all(beforeLedgerItemDetails.map(async item => {
                    const beforeLedgerItem = item;

                    // get respective ledger item from afterLedgerItemDetails
                    const afterLedgerItem = await afterLedgerItemDetails.find(x => x.id == beforeLedgerItem.id);

                    for (const key in beforeLedgerItem) {
                        if (beforeLedgerItem?.hasOwnProperty(key) && afterLedgerItem?.hasOwnProperty(key)) {
                            if (beforeLedgerItem[key] === afterLedgerItem[key]) {
                                // if values in both keys are same nothing happens here
                            } else {

                                // insert in the 'ledger_fields_changes' changes made for the fields
                                const fieldsChanges = {
                                    ledger_activity_track_id: ledgerActivityData?.data[0]?.id,
                                    ledger_item_details_id: beforeLedgerItem?.id,
                                    field_name: await toTitleCase(key),
                                    old_value: beforeLedgerItem[key],
                                    new_value: afterLedgerItem[key]
                                };
                                await indexRepository.store('ledger_fields_changes', fieldsChanges);
                            }
                        }
                    }
                }));

            } else if (key == 'ledger_addresses' && beforeUpdate.hasOwnProperty('ledger_addresses') && afterUpdate.hasOwnProperty('ledger_addresses')) {

                const beforeLedgerAddressDetails = beforeUpdate.ledger_addresses;
                const afterLedgerAddressDetails = afterUpdate.ledger_addresses;

                // loop before ledger items
                await Promise.all(beforeLedgerAddressDetails.map(async item => {

                    const beforeAddress = item;
                    // get respective ledger address from afterLedgerAddressDetails
                    const afterAddress = await afterLedgerAddressDetails.find(x => x.address_type == beforeAddress.address_type);

                    for (const key in beforeAddress) {
                        if (beforeAddress.hasOwnProperty(key) && afterAddress.hasOwnProperty(key)) {
                            if (beforeAddress[key] === afterAddress[key]) {
                                // if values in both keys are same nothing happens here
                            } else {


                                let old_value = beforeAddress[key];
                                let new_value = afterAddress[key];

                                if (key == 'state_id') {

                                    old_value = await indexRepository.find('states', ['name'], { id: old_value });
                                    new_value = await indexRepository.find('states', ['name'], { id: new_value });
                                    old_value = old_value.data[0]?.name;
                                    new_value = new_value.data[0]?.name;
                                }

                                if (key == 'country_id') {

                                    old_value = await indexRepository.find('countries', ['name'], { id: old_value });
                                    new_value = await indexRepository.find('countries', ['name'], { id: new_value });
                                    old_value = old_value.data[0]?.name;
                                    new_value = new_value.data[0]?.name;
                                }

                                // insert in the 'ledger_fields_changes' changes made for the fields
                                let fieldName = await toTitleCase(key);
                                fieldName = (beforeAddress.address_type == 1) ? 'Shipping ' + fieldName : 'Billing ' + fieldName;
                                const fieldsChanges = {
                                    ledger_activity_track_id: ledgerActivityData?.data[0]?.id,
                                    field_name: fieldName,
                                    old_value: old_value,
                                    new_value: new_value
                                };
                                // console.log(fieldsChanges, 'fieldsChangesaddress')
                                await indexRepository.store('ledger_fields_changes', fieldsChanges);
                            }
                        }
                    }
                }));
            } else if (key != 'ledger_item_details' && key != 'ledger_addresses') {

                if (beforeUpdate.hasOwnProperty(key) && afterUpdate.hasOwnProperty(key)) {
                    if (beforeUpdate[key] === afterUpdate[key]) {
                        // if values in both keys are same nothing happens here
                    } else {

                        if(key == 'date' || key == 'due_date'){
                            const fieldsChanges = {
                                ledger_activity_track_id: ledgerActivityData?.data[0]?.id,
                                field_name: await toTitleCase(key),
                                old_value: moment(beforeUpdate[key]).format(dateFormat),
                                new_value: moment(afterUpdate[key]).format(dateFormat)
                            };
                            await indexRepository.store('ledger_fields_changes', fieldsChanges);
                        } else {
                        // insert in the 'ledger_fields_changes' changes made for the fields
                        const fieldsChanges = {
                            ledger_activity_track_id: ledgerActivityData?.data[0]?.id,
                            field_name: await toTitleCase(key),
                            old_value: beforeUpdate[key],
                            new_value: afterUpdate[key]
                        };
                        await indexRepository.store('ledger_fields_changes', fieldsChanges);
                    }
                    }
                }
            }
        }
    }
});

/**
 * Ledger Reminder Event To send the Remider for the Employees in approval flow
 */
// events.on('ledgerReminder', async (data) => {

//     // Get invoice-pending-approval reminder configuration.
//     const reminderConfig = await indexRepository.find('reminder_configurations', ['id'], { slug: data.slug });

//     // get reminder referrables content
//     const reminderRefarrable = await indexRepository.find('reminder_referrables', ['content'], { reminder_name_id: reminderConfig?.data[0]?.id });

//     approversData?.approval_users.map(async reminderTo => {

//         const replaceObj = {
//             '{{invoice_number}}': ledger.reference_id,
//             '{{client_name}}': ledger.company_name,
//             '{{invoice_date}}': ledger.date,
//             '{{due_date}}': ledger.due_date
//         }

//         // Generate template
//         allReplace(emailTempData.data[0].subject, replaceObj);

//         // Create object to inser reminder data.
//         // const reminderData = {
//         //     reminder_slug_id: reminderConfig?.data[0]?.id,
//         //     employee_id: reminderTo,
//         //     // template: 
//         // };

//         // Insert Data to Reminders for respectrive employees.
//         // await indexRepository.store('reminders')
//     });
// });


module.exports = { events };