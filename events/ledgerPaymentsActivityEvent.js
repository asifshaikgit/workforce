const EventEmitter = require('events');
const events = new EventEmitter();
const indexRepository = require('../src/v1/user/repositories/index');
const { toTitleCase } = require('../helpers/globalHelper');

/**
 * Ledger Payments Activity Track - common for store, update, delete.
 */
events.on('ledgerPaymentsActivity', async (data) => {

    data = data.activity;

    // create an object 'ledgerPaymentsActivityTrack' and insert in 'expense_activity_track' table.
    let ledgerPaymentsActivityTrack = {
        ledger_payment_id: data?.ledger_payment_id,
        action_type: data?.action_type,
        created_by: data?.created_by
    }

    const ledgerPaymentActivityData = await indexRepository.store('ledger_payment_activity_track', ledgerPaymentsActivityTrack);

    // create records in 'ledger_fields_changes' table if any changes in field values
    if (data?.action_type == 2 && data?.beforeUpdate) {

        const beforeUpdate = data?.beforeUpdate;

        // Get Latest Legder Payment Changes
        let afterUpdate = await indexRepository.rawQuery(data?.query);
        afterUpdate = afterUpdate[0];

        // update the changes in ledgerPaymentsData if any
        for (const key in beforeUpdate) {

            if (key == 'ledger_payment_section_details' && beforeUpdate.hasOwnProperty('ledger_payment_section_details') && afterUpdate.hasOwnProperty('ledger_payment_section_details')) {

                // update changes in the ledger_payment_section_details
                const beforeLedgerPaymentSectionDetails = beforeUpdate.ledger_payment_section_details;
                const afterLedgerPaymentSectionDetails = afterUpdate.ledger_payment_section_details;

                // loop before ledger Payment sectrions
                await Promise.all(beforeLedgerPaymentSectionDetails.map(async item => {
                    const beforeLedgerPaymentItem = item;

                    // get respective ledger payment section from afterLedgerItemDetails
                    const afterLedgerPaymentItem = await afterLedgerPaymentSectionDetails.find(x => x.id == beforeLedgerPaymentItem.id);

                    for (const key in beforeLedgerPaymentItem) {
                        if (beforeLedgerPaymentItem.hasOwnProperty(key) && afterLedgerPaymentItem.hasOwnProperty(key)) {
                            if (beforeLedgerPaymentItem[key] === afterLedgerPaymentItem[key]) {
                                // if values in both keys are same nothing happens here
                            } else {
                                // insert in the 'ledger_payment_activity_fields_changes' changes made for the fields
                                const fieldsChanges = {
                                    ledger_payment_activity_track_id: ledgerPaymentActivityData?.data[0]?.id,
                                    ledger_payment_section_details_id: beforeLedgerPaymentItem?.id,
                                    field_name: await toTitleCase(key),
                                    old_value: beforeLedgerPaymentItem[key],
                                    new_value: afterLedgerPaymentItem[key]
                                };
                                await indexRepository.store('ledger_payment_activity_fields_changes', fieldsChanges);
                            }
                        }
                    }
                }));
            } else if (key != 'ledger_payment_section_details') {
                if (beforeUpdate.hasOwnProperty(key) && afterUpdate.hasOwnProperty(key)) {
                    if (beforeUpdate[key] === afterUpdate[key]) {
                        // if values in both keys are same nothing happens here
                    } else {
                        // insert in the 'ledger_payment_activity_fields_changes' changes made for the fields
                        const fieldsChanges = {
                            ledger_payment_activity_track_id: ledgerPaymentActivityData?.data[0]?.id,
                            field_name: await toTitleCase(key),
                            old_value: beforeUpdate[key],
                            new_value: afterUpdate[key]
                        };
                        await indexRepository.store('ledger_payment_activity_fields_changes', fieldsChanges);
                    }
                }
            }
        }
    }
});
module.exports = { events };