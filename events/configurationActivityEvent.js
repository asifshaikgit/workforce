const AwaitEventEmitter = require('await-event-emitter').default
var event = new AwaitEventEmitter()
const { toTitleCase } = require('../helpers/globalHelper');
const { getConnection } = require('../src/middlewares/connectionManager')
const indexRepository = require('../src/v1/user/repositories/index');
const commonService = require('../src/v1/user/services/configurations/commonService');

event.on("configurationUpdateActivity", async (data) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        let afterUpdateData;
        if (data?.activity?.slug == 'skills') {
            afterUpdateData = await commonService.getSkillsData({ id: data?.activity?.referrable_id })
        } else if (data?.activity?.slug == 'employee_category') {
            afterUpdateData = await commonService.getCategory({ 'employee_categories.id': data?.activity?.referrable_id })
        } else if (data?.activity?.slug == 'onboarding_document_types') {
            afterUpdateData = await commonService.getOnBoardingDocumentData(data?.activity?.referrable_id);
        } else if (data?.activity?.slug == 'roles_status') {
            afterUpdateData = await commonService.getRolesStatus(data?.activity?.referrable_id);
        }

        const beforeUpdateData = data.beforeUpdateData;
        if (JSON.stringify(beforeUpdateData) !== JSON.stringify(afterUpdateData)) {

            var fieldData = {
                referrable_id: data.activity.referrable_id,
                referrable_type: data.activity.referrable_type,
                action_type: data.activity.action_type,
                created_at: new Date(),
                created_by: data.activity.created_by
            };

            const changeLog = [];
            for (const key in afterUpdateData) {
                if (beforeUpdateData[key] !== afterUpdateData[key]) {
                    const tempLog = {
                        'label_name': key,
                        'old_value': beforeUpdateData[key],
                        'new_value': afterUpdateData[key]
                    }
                    changeLog.push(tempLog);
                }
            }

            const db = await getConnection();
            fieldData.change_log = JSON.stringify(changeLog);
            await db('configuration_activity_track').insert(fieldData);
        }
        // Commit the transaction
        await trx.commit();
        // Commit the transaction

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
})


event.on("configurationDeleteActivity", async (data) => {

    var fieldData = {
        referrable_id: data.referrable_id,
        referrable_type: data.referrable_type,
        action_type: data.action_type,
        created_at: new Date(),
        created_by: data.created_by,
        change_log: data.change_log
    };

    const db = await getConnection()
    await db('configuration_activity_track').insert(fieldData);
})

//store activity
event.on('configurationStoreActivity', async (data) => {

    var fieldData = {
        referrable_id: data.activity.referrable_id,
        referrable_type: data.activity.referrable_type,
        action_type: data.activity.action_type,
        created_at: new Date(),
        created_by: data.activity.created_by,
        change_log: data.activity?.change_log
    };

    const db = await getConnection()
    await db('configuration_activity_track').insert(fieldData);

});

event.on('configurationReminderActivity', async (data) => {

    if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {
        // create an object 'lconfiguraytionActivityTrack' and insert in 'expense_activity_track' table.
        let configActivityTrack = {
            referrable_id: data.activity.referrable_id,
            referrable_type: data.activity.referrable_type,
            action_type: data.activity.action_type,
            created_at: new Date(),
            created_by: data.activity.created_by
        }

        const configurationActivityData = await indexRepository.store('configuration_activity_track', configActivityTrack);


        // create records in 'configuration_fields_changes' table if any changes in field values
        const beforeUpdateData = data?.beforeUpdateData;
        const afterUpdateData = data?.afterUpdateData;

        for (const key in beforeUpdateData) {
            if (JSON.stringify(beforeUpdateData[key]) !== JSON.stringify(afterUpdateData[key])) {
                if (key == 'group_ids' || key == 'employee_ids') {
                    const fieldsChanges = {
                        configuration_activity_track_id: configurationActivityData?.data[0]?.id,
                        field_name: key,
                        old_value: beforeUpdateData[key] != null ? JSON.stringify(beforeUpdateData[key]) : null,
                        new_value: afterUpdateData[key] != null ? JSON.stringify(afterUpdateData[key]) : null,
                    };
                    await indexRepository.store('configuration_fields_changes', fieldsChanges);
                } else if (key == 'Reminder Cycle') {
                    const fieldsChanges = {
                        configuration_activity_track_id: configurationActivityData?.data[0]?.id,
                        field_name: key,
                        old_value: beforeUpdateData[key] != null ? JSON.stringify(beforeUpdateData[key]) : null,
                        new_value: afterUpdateData[key] != null ? JSON.stringify(afterUpdateData[key]) : null,
                    };
                    await indexRepository.store('configuration_fields_changes', fieldsChanges);
                } else {
                    const fieldsChanges = {
                        configuration_activity_track_id: configurationActivityData?.data[0]?.id,
                        field_name: key,
                        old_value: beforeUpdateData[key] != null ? beforeUpdateData[key] : null,
                        new_value: afterUpdateData[key] != null ? afterUpdateData[key] : null,
                    };
                    await indexRepository.store('configuration_fields_changes', fieldsChanges);
                }
            }
        }

        // update the changes in ledgersData if any
        // for (const key in beforeUpdateData) {
        //     if (key == 'reminders' && beforeUpdateData && afterUpdateData && beforeUpdateData.hasOwnProperty('reminders') && afterUpdateData.hasOwnProperty('reminders')) {

        //         // update changes in the ledger_item_details
        //         const beforereminderDetails = beforeUpdateData.reminders;
        //         const afterreminderDetails = afterUpdateData.reminders;

        //         // loop before ledger items
        //         await Promise.all(beforereminderDetails.map(async item => {
        //             const beforeReminderItem = item;

        //             // get respective ledger item from afterreminderDetails
        //             const afterReminderItem = await afterreminderDetails.find(x => x.id == beforeReminderItem.id);

        //             for (const key in beforeReminderItem) {
        //                 if (beforeReminderItem && afterReminderItem && beforeReminderItem.hasOwnProperty(key) && afterReminderItem.hasOwnProperty(key)) {
        //                     if (beforeReminderItem[key] === afterReminderItem[key]) {
        //                         // if values in both keys are same nothing happens here
        //                     } else {

        //                         // insert in the 'configuration_fields_changes' changes made for the fields
        //                         const fieldsChanges = {
        //                             configuration_activity_track_id: configurationActivityData?.data[0]?.id,
        //                             sub_referrable_id: beforeReminderItem?.id,
        //                             field_name: await toTitleCase(key),
        //                             old_value: beforeReminderItem[key],
        //                             new_value: afterReminderItem[key]
        //                         };
        //                         await indexRepository.store('configuration_fields_changes', fieldsChanges);
        //                     }
        //                 }
        //             }
        //         }));

        //     } else {
        //         if (beforeUpdateData.hasOwnProperty(key) && afterUpdateData.hasOwnProperty(key)) {
        //             if (beforeUpdateData[key] === afterUpdateData[key]) {
        //                 // if values in both keys are same nothing happens here
        //             } else {
        //                 // insert in the 'configuration_fields_changes' changes made for the fields
        //                 const fieldsChanges = {
        //                     configuration_activity_track_id: configurationActivityData?.data[0]?.id,
        //                     field_name: await toTitleCase(key),
        //                     old_value: beforeUpdateData[key],
        //                     new_value: afterUpdateData[key]
        //                 };
        //                 await indexRepository.store('configuration_fields_changes', fieldsChanges);
        //             }
        //         }
        //     }
        // }
    }

});

event.on("configurationApprovalUpdateActivity", async (data) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        if (JSON.stringify(data.beforeUpdateData.data) !== JSON.stringify(data.afterUpdateData.data)) {
            var fieldData = {
                referrable_id: data.activity.referrable_id,
                referrable_type: data.activity.referrable_type,
                action_type: data.activity.action_type,
                created_at: new Date(),
                created_by: data.activity.created_by
            };

            const db = await getConnection()
            let configutaionActivity = await db('configuration_activity_track').insert(fieldData, 'id');

            /**Checking for same objects in before and after update data based on object id */
            for (const itemA of data.beforeUpdateData.data) {
                /**array.find() function will be return same object from both the arrays*/
                const matchingItemB = data.afterUpdateData.data.find(itemB => itemB.id === itemA.id);
                /**If same object contain both arrays then need to compare the both object based on key and value */
                if (matchingItemB) {
                    /**Looping the before object for compare each key of both objects */
                    for (const keyy in itemA) {
                        /**Compare the both objects */
                        if (JSON.stringify(itemA[keyy]) !== JSON.stringify(matchingItemB[keyy])) {
                            var fieldData = {
                                configuration_activity_track_id: configutaionActivity[0].id,
                                field_name: keyy,
                                old_value: JSON.stringify(itemA[keyy]),
                                new_value: JSON.stringify(matchingItemB[keyy])
                            }
                            const db = await getConnection()
                            await db('configuration_fields_changes').insert(fieldData);
                        }
                    }
                }
                /**If beforeUpdateData object is not there in afteUpdateData */
                else {
                    var fieldData = {
                        referrable_id: data.activity.referrable_id,
                        referrable_type: referrable_type,
                        action_type: 3,
                        created_at: new Date(),
                        created_by: data.activity.created_by
                    };

                    const db = await getConnection()
                    await db('configuration_activity_track').insert(fieldData, 'id');
                }
            }

            /**checking for new bankdetails object in after update data */
            for (const itemB of data.afterUpdateData.data) {
                const matchingItemA = data.beforeUpdateData.data.find(itemA => itemA.id === itemB.id);
                /**If after update data contain new contact object */
                if (!matchingItemA) {
                    var fieldData = {
                        referrable_id: data.activity.referrable_id,
                        referrable_type: referrable_type,
                        action_type: 1,
                        created_at: new Date(),
                        created_by: data.activity.created_by
                    };

                    const db = await getConnection()
                    await db('configuration_activity_track').insert(fieldData, 'id');
                }
            }
        }
        // Commit the transaction
        await trx.commit();
        // Commit the transaction

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
})

event.on("configurationNotificationActivity", async (data) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {
            var fieldData = {
                referrable_id: data.activity.referrable_id,
                referrable_type: data.activity.referrable_type,
                action_type: data.activity.action_type,
                created_at: new Date(),
                created_by: data.activity.created_by
            };

            const db = await getConnection()
            let configutaionActivity = await db('configuration_activity_track').insert(fieldData, 'id');

            for (const key in data.afterUpdateData) {
                if (key == "Assign To") {
                    if (JSON.stringify(data.beforeUpdateData[key]) !== JSON.stringify(data.afterUpdateData[key])) {
                        var fieldData = {
                            configuration_activity_track_id: configutaionActivity[0].id,
                            field_name: key,
                            old_value: data.beforeUpdateData[key] != null ? JSON.stringify(data.beforeUpdateData[key]) : null,
                            new_value: data.afterUpdateData[key] != null ? JSON.stringify(data.afterUpdateData[key]) : null,
                        }
                        const db = await getConnection()
                        await db('configuration_fields_changes').insert(fieldData);
                    }
                } else {
                    if (data.beforeUpdateData[key] !== data.afterUpdateData[key]) {
                        var fieldData = {
                            configuration_activity_track_id: configutaionActivity[0].id,
                            field_name: key,
                            old_value: data.beforeUpdateData[key] != null ? data.beforeUpdateData[key] : null,
                            new_value: data.afterUpdateData[key] != null ? data.afterUpdateData[key] : null,
                        }
                        const db = await getConnection()
                        await db('configuration_fields_changes').insert(fieldData);
                    }
                }


            }
        }
        // Commit the transaction
        await trx.commit();
        // Commit the transaction

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
})

event.on("configurationRolesUpdateActivity", async (data) => {

    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        let beforeUpdateData = data.beforeUpdateData;
        let afterUpdateData = {};
        afterUpdateData = await commonService.getRolesData(data?.activity, { id: data?.activity?.referrable_id });

        const subModuleBeforeUpdate = (beforeUpdateData?.subModuleChanges) ?? {};
        const subModuleAfterUpdate = (afterUpdateData?.subModuleChanges) ?? {};

        delete beforeUpdateData?.subModuleChanges;
        delete afterUpdateData?.subModuleChanges;

        if ((JSON.stringify(beforeUpdateData) !== JSON.stringify(afterUpdateData)) || (subModuleBeforeUpdate?.length > 0 && subModuleAfterUpdate?.length > 0)) {

            var fieldData = {
                referrable_id: data.activity.referrable_id,
                referrable_type: data.activity.referrable_type,
                action_type: data.activity.action_type,
                created_at: new Date(),
                created_by: data.activity.created_by
            };

            let changeLog = [];
            for (const key in afterUpdateData) {
                if (beforeUpdateData[key] !== afterUpdateData[key]) {
                    const temp_log = {
                        'label_name': key,
                        'old_value': beforeUpdateData[key],
                        'new_value': afterUpdateData[key],
                        'action_by': data.activity.created_by
                    }
                    changeLog.push(temp_log);
                }
            }

            if (subModuleBeforeUpdate?.length > 0 && subModuleAfterUpdate?.length > 0) {

                subModuleBeforeUpdate?.map(before => {

                    // get sub Module After Update record
                    const after = subModuleAfterUpdate.find(x => x.id === before.id);

                    if (before.is_allowed != after.is_allowed) {
                        const temp_log = {
                            'label_name': before.module_name + '->' + before.sub_module_name,
                            'old_value': before.is_allowed,
                            'new_value': after.is_allowed,
                            'action_by': data.activity.created_by
                        }
                        changeLog.push(temp_log);
                    }
                })
            }
            const db = await getConnection();
            fieldData.change_log = JSON.stringify(changeLog);
            await db('configuration_activity_track').insert(fieldData, 'id');
        }
        // Commit the transaction
        await trx.commit();
        // Commit the transaction

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
})

module.exports = { event }
