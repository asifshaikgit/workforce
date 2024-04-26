const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');

//store bill activity
event.on('billStoreActivity', async (data) => {

  activityData = [];

  var fieldData = `A new bill ${data.activity.bill_reference_id} has been added for the vendor ${data.activity.vendor_name}(${data.activity.vendor_reference_id}) and contractor ${data.activity.employee_name}(${data.activity.employee_reference_id})`
  activityData.push(fieldData)      

  /**Activity store objcet */
  var fieldData = {
    referrable_id: data.activity.bill_id,
    referrable_type: 'bills',
    referrable_sub_type: null,
    action_type: data.activity.action_type,
    activity: activityData.join(','),
    created_at: new Date(),
    created_by: data.activity.created_by,
  };
  /**Activity store objcet */

  if (activityData.length > 0) {
    const db = await getConnection();
    await db('activity_track').insert(fieldData);
  }

});

//Bill update activity event
event.on('billUpdateActivity', async (data) => {
  /** In activityData[] store the activity mmassages*/
    activityData = [];
    /**Comparing the beforeUpadteData and afterUpdateDate */
    if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {

      /**Default variablr */
      var fieldData =`In bills ${data.beforeUpdateData['Bill Number']} has been updated -`
      /**Default variablr */

      /**Iterating afterUpdate data */
      for (const key in data.afterUpdateData) {

            /**Ignoring some feilds activity track */
            if (key != 'created_at' && key != 'updated_at' && key != 'deleted_at' && key != 'created_by' && key != 'updated_by' && key != 'create_emp' && key != 'update_emp' && key != 'start_date') {

              /**Comparing both object values based the the key*/
              if (data.beforeUpdateData[key] !== data.afterUpdateData[key]) {

                /**If key is bill details*/
                if(key == 'Bill Details'){
                  /**Comparing the before and after data*/
                  for (const itemA of data.beforeUpdateData[key]) {
                  
                    /* Using Array.find() method same object from afterUpdateData array based on object Id*/
                     const matchingItemB = data.afterUpdateData[key].find(itemB => itemB.id === itemA.id);
                     /**If matching object find out then compare the both object data and store the change activity */

                     /**If same object present in before and after update data and compare the both object values based on keys */
                     if (matchingItemB) {
                         for(const keyy in itemA){
                            if (itemA[keyy] !== matchingItemB[keyy]) {  
                              fieldData +=` for the service ${itemA['Service Name']} the ${keyy} has been changed from ${itemA[keyy]} to ${matchingItemB[keyy]}`
                              activityData.push(fieldData);
                              fieldData = ``                                                           
                            }
                         }
                     } 
                     /**If beforeIpdate object is not there in afterUpdateData */
                     else {
                        fieldData +=` the service ${itemA['Service Name']} has been deleted`
                        activityData.push(fieldData);
                        fieldData = `` 
                     }
                  }
     
                 /**Comparing afterUpdateData with beforeUpdateData*/
                 for (const itemB of data.afterUpdateData[key]) {
                     const matchingItemA = data.beforeUpdateData[key].find(itemA => itemA.id === itemB.id);
                     /**If itemB obejct not present in beforeUpdateData then we are adding that this object as a new contact details */
                     if (!matchingItemA) {
                         fieldData +=` a new ${itemB['Service Name']} service details has been added`
                         activityData.push(fieldData);
                         fieldData = ``
                     }
                 }
                } 
                /**If key id Document */
                else if(key == 'Documents'){

                  /**Iterate the Documnet array */
                  for (const itemA of data.beforeUpdateData[key]) {
                  
                    /* Using Array.find() method same object from afterUpdateData array based on object Id*/
                     const matchingItemB = data.afterUpdateData[key].find(itemB => itemB.id === itemA.id);
                     /**If matching object find out then compare the both object data and store the change activity */
                     if (!matchingItemB) {
                      fieldData +=` a ${itemA.document_name} supporting document has been deleted`
                      activityData.push(fieldData);
                      fieldData = ``
                     }
                  }

                  /**Comparing afterUpdateData with beforeUpdateData*/
                 for (const itemB of data.afterUpdateData[key]) {
                  const matchingItemA = data.beforeUpdateData[key].find(itemA => itemA.id === itemB.id);
                  /**If itemB obejct not present in beforeUpdateData then we are adding that this object as a new contact details */
                  if (!matchingItemA) {
                    fieldData +=` a new supporting document has been uploaded`
                    activityData.push(fieldData);
                    fieldData = ``
                    break
                  }
              }
                } else {
                  fieldData +=` the ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                  activityData.push(fieldData);
                  fieldData = ``
                }
              }
            }
      }
      /**Activity store object */
      var fieldData = {
        referrable_id: data.activity.bill_id,
        referrable_type: 'bills',
        referrable_sub_type: null,
        action_type: data.activity.action_type,
        activity: activityData.join(','),
        created_at: new Date(),
        created_by: data.activity.created_by,
      };
      /**Activity store object */

      if (activityData.length > 0) {
        const db = await getConnection();
        await db('activity_track').insert(fieldData);
      }
    }
});

//delete bill activity
// event.on('billDeleteActivity', async (data) => {
  
//     var activityData = [];
  
//     var fieldData = ``
//     activityData.push(fieldData)
    
//     var fieldData = {
//       bill_id: data.bill_id,
//       action_type: data.action_type,
//       activity: activityData.join(','),
//       created_at: new Date(),
//       created_by: data.created_by,
//     };
//     if (activityData.length > 0) {
//       const db = await getConnection();
//       await db('activity_track').insert(fieldData);
//     }
// });

//store bill activity
event.on('paymentStoreActivity', async (data) => {

  activityData = [];
  var fieldData = `A new payment ${data.activity.payment_reference_id} has been paid for vendor ${data.activity.vendor_name}(${data.activity.vendor_reference_id})`
  activityData.push(fieldData)      

  /**Activity store object */
  var fieldData = {
    referrable_id: data.activity.payment_id,
    referrable_type: 'bill-payments',
    referrable_sub_type: null,
    action_type: data.activity.action_type,
    activity: activityData.join(','),
    created_at: new Date(),
    created_by: data.activity.created_by,
  };
  /**Activity store object */

  if (activityData.length > 0) {
    const db = await getConnection();
    await db('activity_track').insert(fieldData);
  }

});

//Bill update activity event
event.on('paymentUpdateActivity', async (data) => {
  /** In activityData[] store the activity data*/
    activityData = [];
    if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {
      var fieldData =`In payments ${data.beforeUpdateData['Reference Id']} has been updated -`
      for (const key in data.afterUpdateData) {
            if (key != 'created_at' && key != 'updated_at' && key != 'deleted_at' && key != 'created_by' && key != 'updated_by' && key != 'create_emp' && key != 'update_emp' && key != 'start_date') {
              if (data.beforeUpdateData[key] !== data.afterUpdateData[key]) {
                /**For bill details */
                if(key == 'Bills Section'){
                  /**Comparing the before and after data*/
                  for (const itemA of data.beforeUpdateData[key]) {
                  
                    /* Using Array.find() method same object from afterUpdateData array based on object Id*/
                     const matchingItemB = data.afterUpdateData[key].find(itemB => itemB.id === itemA.id);
                     /**If matching object find out then compare the both object data and store the change activity */
                     if (matchingItemB) {
                         for(const keyy in itemA){
                            if (itemA[keyy] !== matchingItemB[keyy]) {  
                              fieldData +=` for the bill ${itemA['Bill']} the ${keyy} has been changed from ${itemA[keyy]} to ${matchingItemB[keyy]}`
                              activityData.push(fieldData);
                              fieldData = ``                                                           
                            }
                         }
                     } 
                  }
                } else if(key == 'Documents'){
                  /**Iterating documents array and Comparing afterUpdateData with beforeUpdateData*/
                  for (const itemB of data.afterUpdateData[key]) {
                    const matchingItemA = data.beforeUpdateData[key].find(itemA => itemA.id === itemB.id);
                    /**If itemB obejct not present in beforeUpdateData then we are adding that this object as a new contact details */
                    
                    /**If new object present in after update data */
                    if (!matchingItemA) {
                      fieldData +=` a new reference document has been uploaded`
                      activityData.push(fieldData);
                      fieldData = ``
                      break
                    }
                  }
                } else {
                  fieldData +=` the ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                  activityData.push(fieldData);
                  fieldData = ``
                }
              }
            }
      }
  
      /**Activity store object */
      var fieldData = {
        referrable_id: data.activity.payment_id,
        referrable_type: 'bill-payments',
        referrable_sub_type: null,
        action_type: data.activity.action_type,
        activity: activityData.join(','),
        created_at: new Date(),
        created_by: data.activity.created_by,
      };
      /**Activity store object */
  
      if (activityData.length > 0) {
        const db = await getConnection();
        await db('activity_track').insert(fieldData);
      }
    }
});

module.exports = { event };
