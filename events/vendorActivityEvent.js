const EventEmitter = require('events');
const event = new EventEmitter();
const { getConnection } = require('../src/middlewares/connectionManager');
const indexRepository = require("../src/v1/user/repositories/index");

event.on('vendorUpdateActivity', async (data) => {
/** In activityData[] store the changed fields data*/
  activityData = [];
  if (JSON.stringify(data.beforeUpdateData) !== JSON.stringify(data.afterUpdateData)) {
    var isSameAsAbove = false
    for (const key in data.afterUpdateData) {
          if (key != 'created_at' && key != 'updated_at' && key != 'deleted_at' && key != 'created_by' && key != 'updated_by' && key != 'create_emp' && key != 'update_emp' && key != 'start_date') {

            if (data.beforeUpdateData[key] !== data.afterUpdateData[key]) {
              /** If activityData[] is contain values then add space at starting of next index value else no need.*/
              if(activityData.length > 0){

                if(!isSameAsAbove){

                    if(key == 'Same As Above'){
                        var fieldData =` the shipping address details has been updated`
                        activityData.push(fieldData);
                        isSameAsAbove = true
                    }else {
                        var fieldData =` ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                        activityData.push(fieldData)
                    }
                }

              } else {

                /**vendor module contain sub-modules, the sub-modules are managing with using switch cases. */
                switch(data.activity.vendor_sub_module){

                  /** company details */
                  case 1 : 
                        if(key == 'Same As Above'){
                            var fieldData =`For the vendor ${data.beforeUpdateData['Name']}(${data.beforeUpdateData['Reference Id']}) - the shipping address details has been updated`
                            activityData.push(fieldData); 
                            isSameAsAbove = true                           
                        } else {
                            var fieldData =`For the vendor ${data.beforeUpdateData['Name']}(${data.beforeUpdateData['Reference Id']}) - the ${key} has been changed from ${data.beforeUpdateData[key]} to ${data.afterUpdateData[key]}`
                            activityData.push(fieldData);
                        }
                    break;

                  /** contact details */
                  case 2:
                    var fieldData =`For the vendor ${data.activity.vendor_name}(${data.activity.reference_id}) -`
                    for (const itemA of data.beforeUpdateData.data) {
                        const matchingItemB = data.afterUpdateData.data.find(itemB => itemB.id === itemA.id);
                        if (matchingItemB) {
                            for(const keyy in itemA){
                                if (itemA[keyy] !== matchingItemB[keyy]) {
                                    if(key !== 'Display Name') {
                                        fieldData +=` for the contact ${itemA['Display Name']} ${keyy} has been changed from ${itemA[keyy]} to ${itemA[keyy]}`
                                        activityData.push(fieldData);
                                        fieldData = ``
                                    }
                                }
                            }
                        }
                    }
        
                    for (const itemB of data.afterUpdateData.data) {
                        const matchingItemA = data.beforeUpdateData.data.find(itemA => itemA.id === itemB.id);
                        if (!matchingItemA) {
                            fieldData +=` a new ${itemB['Display Name']} contact details has been added`
                            activityData.push(fieldData);
                            fieldData = ``
                        }
                    }
                        
                    break;
                }
              }
            }
          }
    }

    var fieldData = {
      referrable_id: data.activity.vendor_id,
      referrable_type: 'vendors',
      referrable_sub_type: data.activity.vendor_sub_module, 
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
event.on('vendorDeleteActivity', async (data) => {

  activityData = [];

  switch(data.vendor_sub_module){
    case 1 : //vendor profile
        var fieldData = `A vendor ${data.vendor_name}(${data.reference_id}) has been deleted.`
        activityData.push(fieldData)
      break;

    case 2 : //contact details
        var fieldData = `For the vendor ${data.vendor_name}(${data.reference_id}) - a ${data.contact_name} contact details has been deleted.`
        activityData.push(fieldData)
      break;
  }

  var fieldData = {
    referrable_id: data.vendor_id,
    referrable_type: 'vendors',
    referrable_sub_type: data.vendor_sub_module,
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
event.on('vendorStoreActivity', async (data) => {

  activityData = [];
  switch(data.activity.vendor_sub_module){
    case 1 : //company details
        var fieldData = `A new vendor ${data.activity.vendor_name}(${data.activity.reference_id}) has been added.`
        activityData.push(fieldData)
      break;

    case 2 : //contact details
        var fieldData = `For the vendor ${data.activity.vendor_name}(${data.activity.reference_id}) -`
        for (let i = 0; i < data.activity.contact_names.length; i++) {
            fieldData +=` A new ${data.activity.contact_names[i]} contact-details has been added.`
            activityData.push(fieldData)
            fieldData = ``
        }
      break;
  }

  var fieldData = {
    referrable_id: data.activity.vendor_id,
    referrable_type: 'vendors',
    referrable_sub_type: data.activity.vendor_sub_module,
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

/**
 * Handles the 'VendorData' event and performs a series of updates and deletions
 * on various repositories based on the provided data.
 * @param {Object} data - The data object containing the condition and updateData.
 * @returns {Promise} A promise that resolves with the repository response.
 */
/**
 * Event handler for the 'VendorData' event. Updates various repositories with the provided data.
 * @param {object} data - The data object containing the condition and updateData.
 * @returns {Promise<object>} - A promise that resolves to the repository response.
 */
event.on('VendorData', async (data) => {

    await indexRepository.update('vendor_address', data.condition, data.updateData); // update in vendor address table
  
    await indexRepository.update('vendor_contacts', data.condition, data.updateData);// update in vendor contacts table
  
    let condition = { id: data.condition.vendor_id }; // condition
  
    /**
     * Softdelete i.e update the vendor data object
     */
    let updateData = {
      is_active: false,
      deleted_at: new Date(),
      updated_at: new Date(),
      updated_by: data.updateData.updated_by,
    };
  
    await indexRepository.update('vendors', condition, updateData); // update vendor data
  
});

module.exports = { event };
