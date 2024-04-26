const placementRepository = require('../../../repositories/placement/placementRepository')
const placementTimesheetService = require('../../../services/placement/placementTimesheetServices')
const placementInvoiceService = require('../../../services/placement/placementInvoiceServices')
const placementBillingServices = require('../../../services/placement/placementBillingServices')
const placementClientServices = require('../../../services/placement/placementClientService')

const moment = require('moment')
const { convertJsonToExcelEmployee } = require('../../../../../../utils/json_to_excel')
const indexRepository = require("../../../repositories/index")

const exportPlacementInfo1 = async (condition) => {

    var placement = await placementRepository.placementExport(condition); // Placement and its related information
    if (placement.status) {

        /* Variables */
        var listingObject = []
        var total_details = placement.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        var serial_no = 1
        for (let item in total_details) {

            let timesheet_details = await placementTimesheetService.index({ "placements.id": total_details[item].id }); //Fetch the timesheet details
            let invoice_details = await placementInvoiceService.index({ "placements.id": total_details[item].id }); // Fetches the invoice configuration details
            let billing_details = await placementBillingServices.index({ placement_id: total_details[item].id }); // Fetching the billing configuration information
            let billing_details_data
            if (billing_details.status) {
                billing_details_data = billing_details.data[billing_details.data.length - 1]
            }
            listingData = {
                'SNo': serial_no,
                'Placement Id': total_details[item].placement_reference_id,
                'Client ID': total_details[item].client_reference_id ? total_details[item].client_reference_id : '',
                'Client Name': total_details[item].client_name ? total_details[item].client_name : '',
                'Employee ID': total_details[item].employee_reference_id,
                'Employee Name': total_details[item].employee_name,
                'Project Name': total_details[item].project_name ? total_details[item].project_name : '',
                'Project Start Date': total_details[item]?.project_start_date ? moment(total_details[item]?.project_start_date).format('YYYY-MM-DD') : '',
                'Project End Date': total_details[item]?.project_end_date ? moment(total_details[item]?.project_end_date).format('YYYY-MM-DD') : '',
                'Pay-Type': total_details[item].placement_pay_type ? (total_details[item].placement_pay_type === 1 ? 'Salary' : 'Hourly') : '',
                'Job Title': total_details[item].job_title ? total_details[item].job_title : '',
                'Work Email ID': total_details[item].work_email_id ? total_details[item].work_email_id : '',
                'Notice Period': total_details[item].notice_period ? total_details[item].notice_period : '',
                'Bill Rate': billing_details.status ? billing_details_data.bill_rate : '',
                'Ot Bill Rate': billing_details.status ? billing_details_data.ot_bill_rate : '',
                'Timesheet Cycle': timesheet_details.status ? timesheet_details.data[0].cycle_name : '',
                'Timesheet Week Start From': timesheet_details.status ? timesheet_details.data[0].day_name : '',
                'Default Hours': timesheet_details.status ? timesheet_details.data[0].default_hours : '',
                'Timesheet Start Date': timesheet_details.status ? moment(timesheet_details.data[0]?.timesheet_start_date, 'MM/DD/YYYY').format('YYYY-MM-DD') : '',
                'Net Payterms': invoice_details.status ? invoice_details.data[0].net_pay_days : '',
                'Invoice Cycle': invoice_details.status ? invoice_details.data[0].cycle_name : '',
                'Day Start from': invoice_details.status ? invoice_details.data[0].day_name : '',
                'Invoice Start date': invoice_details.status ? moment(invoice_details.data[0]?.invoice_start_date, 'MM/DD/YYYY').format('YYYY-MM-DD') : ''
            };
            serial_no++
            listingObject.push(listingData);
        }
        /* Using Map to iterate the loop and prepare the response */
        if (listingObject.length > 0) {
            var excelfile = await convertJsonToExcelEmployee(listingObject, 'Placements')
            return { status: true, filepath: excelfile }
        }
    } else {
        return placement;
    }
};

const exportPlacementInfo = async (condition, dateFormat, page, limit) => {

    let query = `SELECT * FROM getPlacementListing(`;
    query += (condition.employee_id !== null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.client_id !== null) ? `'${condition.client_id}',` : `${condition.client_id},`;
    query += (condition.reference_id !== null) ? `'${condition.reference_id}',` : `${condition.reference_id},`;
    query += (condition.client_name !== null) ? `'${condition.client_name}',` : `${condition.client_name},`;
    query += (condition.employee_name !== null) ? `'${condition.employee_name}',` : `${condition.employee_name},`;
    query += (condition.status_type !== null) ? `'${condition.status_type}',` : `${condition.status_type},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += `'${dateFormat}', ${limit}, ${page})`;

    // Get employees Lisitng using stored
    const placementListing = await indexRepository.rawQuery(query);

    // Get Placement Bill Details
    // bills = await placementClientServices.getPlacementBillDetails(placementDetails.id, dateFormat);

    // Get Placement Pay Rate
    // current_pay_rate = await placementClientServices.getPlacementPayRate(placementDetails.id, bills.current_bill_rate);

    if (placementListing) {

        // var bills;
        // var current_pay_rate;

        const listingData = await Promise.all(placementListing.map(async (placementDetails, index) => {
            // Get Placement Bill Details
            const bills = await placementClientServices.getPlacementBillDetails(placementDetails.id, dateFormat);

            // Get Placement Pay Rate
            const current_pay_rate = await placementClientServices.getPlacementPayRate(placementDetails.id, bills.current_bill_rate);
            return {
                'SNo': index + 1,
                'Project Name': placementDetails.project_name || '',
                'Client Name': placementDetails.client_name,
                'Client ID': placementDetails.client_reference_id,
                'Employee Name': placementDetails.employee_name,
                'Pay Cycle': placementDetails.pay_cycle,
                'From Date': moment(placementDetails?.project_start_date, 'MM/DD/YYYY').format('YYYY-MM-DD') || '',
                'To Date': moment(placementDetails?.project_end_date, 'MM/DD/YYYY').format('YYYY-MM-DD') || '',
                'Employee ID': placementDetails.employee_reference_id,
                'Placement Id': placementDetails.reference_id,
                'Current Bill Rate': placementDetails.bill_rate || '',
                'Current Pay Rate': current_pay_rate,
                'OT Bill Rate': placementDetails.ot_bill_rate,
                'OT Pay Rate': placementDetails.ot_pay_rate,
                'Timesheet Cycle': placementDetails.timesheet_cycle || '',
                'Invoice Cycle': placementDetails.invoice_cycle || '',
                'Timesheet ID\'s': placementDetails.timesheet_ids || '',
                'Invoice ID\'s': placementDetails.invoice_ids || '',
                'Total Hours': placementDetails.total_hours,
            }
        }));

        if (listingData && listingData.length > 0) {
            var excelfile = await convertJsonToExcelEmployee(listingData, 'Placements')
            return { status: true, filepath: excelfile }
        } else {
            return { status: false }
        }

    } else {
        return placementListing;
    }
}

module.exports = { exportPlacementInfo }