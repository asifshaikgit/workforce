const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');

event.on('endClientUpdateActivity', async (data) => {
/** In activityData[] store the changed fields data*/
  activityData = [];
  if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {
    for (const key in data.afterUpdateData) {
          if (key != 'created_at' && key != 'updated_at' && key != 'deleted_at' && key != 'created_by' && key != 'updated_by' && key != 'create_emp' && key != 'update_emp' && key != 'start_date') {

            if (data.beforeUpdateData[key] !== data.afterUpdateData[key]) {
              /** If activityData[] is contain values then add space at starting of next index value else no need.*/
              if(activityData.length > 0){
                if(key == 'contacts') {
                    var fieldData =``
                      // Compare before to after
                      for (const itemA of data.beforeUpdateData['contacts']) {
                        const matchingItemB = data.afterUpdateData['contacts'].find(itemB => itemB.id === itemA.id);
                        if (matchingItemB) {
                            
                            for (const keyy in matchingItemB) {
                                if(matchingItemB[keyy] !== itemA[keyy] && keyy !== 'Display Name'){
                                    fieldData +=` for the contact ${itemA['Display Name']} the ${keyy} has been changed from ${itemA[keyy]} to ${matchingItemB[keyy]}`
                                    activityData.push(fieldData);
                                    fieldData = ``
                                }
                            }                      
                        } 
                        // else {
                        //   fieldData +=` a ${itemA['Display Name']} contact details has been deleted`
                        //   activityData.push(fieldData);
                        //   fieldData = ``
                        // }
                      }

                      /**checking for new contact object in after update data */
                      for (const itemB of data.afterUpdateData['contacts']) {
                        const matchingItemA = data.beforeUpdateData['contacts'].find(itemA => itemA.id === itemB.id);
                        /**If after update data contain new contact object */
                        if (!matchingItemA) {
                          fieldData +=` a new ${itemB['Display Name']} contact details has been added`
                          activityData.push(fieldData);
                          fieldData = ``
                        }
                      }
                } else {
                    var fieldData =` ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                    activityData.push(fieldData)
                }

              } else {
                if(key == 'contacts') {
                    var fieldData =`For the End-Client ${data.beforeUpdateData['End Client Name']}(${data.beforeUpdateData['Reference Id']}) -`
                      // Compare before to after
                      for (const itemA of data.beforeUpdateData['contacts']) {
                        const matchingItemB = data.afterUpdateData['contacts'].find(itemB => itemB.id === itemA.id);
                        if (matchingItemB) {
                            for (const keyy in matchingItemB) {
                                if(matchingItemB[keyy] !== itemA[keyy] && keyy !== 'Display Name'){
                                    fieldData +=` for the contact ${itemA['Display Name']} the ${keyy} has been changed from ${itemA[keyy]} to ${matchingItemB[keyy]}`
                                    activityData.push(fieldData);
                                    fieldData = ``
                                }
                            }                      
                        } 
                        // else {
                        //   fieldData +=` a ${itemA['Display Name']} contact details has been deleted`
                        //   activityData.push(fieldData);
                        //   fieldData = ``
                        // }
                      }

                      for (const itemB of data.afterUpdateData['contacts']) {
                        const matchingItemA = data.beforeUpdateData['contacts'].find(itemA => itemA.id === itemB.id);
                        if (!matchingItemA) {
                          fieldData +=` a new ${itemB['Display Name']} contact details has been added`
                          activityData.push(fieldData);
                          fieldData = ``
                        }
                      }
                } else {
                    var fieldData =`For the End-Client ${data.beforeUpdateData['End Client Name']}(${data.beforeUpdateData['Reference Id']}) - the ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                    activityData.push(fieldData);
                  }
              }
            }
          }
    }

    var fieldData = {
      referrable_id: data.activity.end_client_id,
      referrable_type: 'end-clients',
      referrable_sub_type: null,      
      action_type: data.activity.action_type,
      activity: activityData.join(','),
      created_at: new Date(),
      created_by: data.activity.created_by,
    };

    if (activityData.length > 0) {
      const db = await getConnection();
      await db('activity_track').insert(fieldData);
    }
  }
});

//delete activity
event.on('endClientDeleteActivity', async (data) => {
  
  var activityData = [];
  if(data.contact_name){
    var fieldData = `For the End-Client ${data.end_client_name}(${data.reference_id}) - the contact ${data.contact_name} has been deleted.`
    activityData.push(fieldData) 
  }else {
    var fieldData = `A End-client ${data.end_client_name}(${data.reference_id}) has been deleted.`
    activityData.push(fieldData) 
  }
        

  var fieldData = {
    referrable_id: data.end_client_id,
    referrable_type: 'end-clients',
    referrable_sub_type: null,      
    action_type: data.action_type,
    activity: activityData.join(','),
    created_at: new Date(),
    created_by: data.created_by,
  };
  if (activityData.length > 0) {
    const db = await getConnection();
    await db('activity_track').insert(fieldData);
  }
});

//store activity
event.on('endClientStoreActivity', async (data) => {

  activityData = [];

  var fieldData = `A new End-Client ${data.activity.end_client_name}(${data.activity.reference_id}) has been added.`
  activityData.push(fieldData)      

  var fieldData = {
    referrable_id: data.activity.end_client_id,
    referrable_type: 'end-clients',
    referrable_sub_type: null,      
    action_type: data.activity.action_type,
    activity: activityData.join(','),
    created_at: new Date(),
    created_by: data.activity.created_by,
  };

  if (activityData.length > 0) {
    const db = await getConnection();
    await db('activity_track').insert(fieldData);
  }

});

module.exports = { event };
