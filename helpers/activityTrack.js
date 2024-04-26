const indexRepository = require('../src/v1/user/repositories/index');
const format = require('./format');
const moment = require('moment')

/**
 * Get Employee Activity data
 * @param {*} condition 
 * @returns 
 */
const getEmployeeActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('employee_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            employee_sub_module : data.employee_sub_module,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

/**
 * Get client activity data
 * @param {*} condition 
 * @returns 
 */
const getClientActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('client_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            client_sub_module : data.client_sub_module,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

/**
 * Get vendor activity data
 * @param {*} condition 
 * @returns 
 */
const getVendorActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('vendor_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            vendor_sub_module : data.vendor_sub_module,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

/**
 * Get End client activity data
 * @param {*} condition 
 * @returns 
 */
const getEndClientActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('end_client_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            end_client_sub_module : data.end_client_sub_module,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

/**
 * Get expense activity data
 * @param {*} condition 
 * @returns 
 */
const getExpenseActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('expense_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

/**
 * Get bills activity data
 * @param {*} condition 
 * @returns 
 */
const getBillActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('bill_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            bill_id: data.bill_id,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

const getBillPaymentActivityTrack = async (condition) => {
    let dateFormat = await format.getDateFormat(); // date format
    
    /**Activity track */
    const activity = await indexRepository.find('bill_payment_activity_track', ['*'], condition, 0, [], null, null, null, false);
    const filteredActivities = activity.data;
    const transformedActivity= []
    serial_no =1
    for(let item in filteredActivities){
        let data = filteredActivities[item]
        let employeeName = await indexRepository.find('employee', ['display_name'], { id: data.created_by });
        activityObject = {
            SNo : serial_no,
            id : data.id,
            payment_id: data.payment_id,
            message : data.activity,
            action_type : data.action_type,
            created_by : employeeName.data[0].display_name,
            created_at : moment(data.created_at).format(dateFormat)
        }
        transformedActivity.push(activityObject)
        serial_no++
    }
    /**Activity track */

    return transformedActivity
}

module.exports = { getEmployeeActivityTrack, getClientActivityTrack, getVendorActivityTrack, getEndClientActivityTrack ,getExpenseActivityTrack, getBillActivityTrack, getBillPaymentActivityTrack};