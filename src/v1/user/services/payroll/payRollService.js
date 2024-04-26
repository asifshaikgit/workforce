const payRollRepository = require('../../repositories/payroll/payRollRepository');
const transactionRepository = require('../../repositories/transactionRepository');
const indexRepository = require('../../repositories/index');
const moment = require('moment')
const format = require('../../../../../helpers/format');
const { color } = require('../../../../../config/color');
const { getConnection } = require('../../../../middlewares/connectionManager');
const { generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const payrollInformationData = require('../../../../../helpers/payrollInformationData');
const { status } = require('../../../themes/invoiceInformation');

const generatePayroll = async (body) => {
    let trx;
    try {

        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /**Variable */
        const condition = { id: body.payroll_configuration_id };
        /**Variable */

        /* Fetching the Payroll Generate Dates Information */
        let payrollData = await indexRepository.find('payroll_configuration', ['id', 'from_date', 'to_date', 'pay_config_setting_id'], { id: body.payroll_configuration_id }, null, [], null, null, null, false);
        payroll = payrollData.data[0]
        /* Fetching the Payroll Generate Dates Information */

        // fetching finalize employee for this payroll
        var finalizedEmployee = await indexRepository.find('payroll_payment_details', ['employee_id'], { payroll_configuration_id: body.payroll_configuration_id, is_finalize: true });
        let alreadyFinilized = [];
        let employeesFetchCondition;
        if (finalizedEmployee.data.length > 0) {
            alreadyFinilized = finalizedEmployee.data.map(obj => `'${obj.employee_id}'`);
            employeesFetchCondition = {
                'global_search': `"employee"."enable_payroll" is true AND "employee"."payroll_config_settings_id" = ${payroll.pay_config_setting_id} and "employee"."id" not in (${alreadyFinilized})`
            };
        } else {
            employeesFetchCondition = {
                'global_search': `"employee"."enable_payroll" is true AND "employee"."payroll_config_settings_id" = ${payroll.pay_config_setting_id}`
            };
        }
        /* Fetching the Employee Information who are not finilized as of now */

        let joins = [
            { table: 'payroll_payment_details as ppd', alias: 'ppd', condition: ['ppd.employee_id', 'employee.id'], type: 'left' }
        ];
        var employeeData = await indexRepository.find('employee', ['employee.id', 'employee.display_name', 'employee.standard_pay_amount'], employeesFetchCondition, 0, joins, null, null, null, true, 'employee.id');
        employee = employeeData.data
        /* Fetching the Employee Information */

        /* Update the Payroll status to drafted */
        await transactionRepository.update(trx, 'payroll_configuration', { id: body.payroll_configuration_id }, { status: 'Drafted' });
        /* Update the Payroll status to drafted */

        /* Iterating the loop through employee data */
        for (const item in employee) {

            // Initially check whether any placements are mapped to the employee. If not mapped then generate the payroll with 0 else genetate the payroll with actual values
            // let placementsExitsCondition = { 'employee_id': employee[item].id }
            // var placementExistsData = await indexRepository.find('placements', ['id'], placementsExitsCondition, null, [], null, null, null, true, null);  // Fetch the palcement information
            // if (placementExistsData.status) {

            /* Fetching the Employees Placement Information */
            let placementDataFields = ['placements.*', 'emp.display_name as display_name', 'emp.hours_worked as hours_worked', 'c.reference_id as client_reference_id', 'ptc.pay_type', 'ptc.pay_value', 'ptc.payroll_pay'];

            let placementDataJoins = [
                { table: 'employee as emp', alias: 'emp', condition: ['placements.employee_id', 'emp.id'] },
                { table: 'companies as c', alias: 'c', condition: ['placements.client_id', 'c.id'], },
                { table: 'pay_type_configuration as ptc', alias: 'ptc', condition: ['placements.pay_type_configuration_id', 'ptc.id'] },
            ];

            let placementsFetchCondition = { 'placements.employee_id': employee[item].id, 'placements.status': 'In Progress', global_search: `("placements"."end_date" >= '${moment(payroll.from_date).format('YYYY-MM-DD')}' or "placements"."end_date" is null)` }
            var placementData = await indexRepository.find('placements', placementDataFields, placementsFetchCondition, null, placementDataJoins)
            /* Fetching the Employees Placement Information */

            /**
             * If placement exists (project is not completed and within date range) store the placement information else store with  default 0.00 values
             */
            if (placementData.status) {

                /* If payroll already generated without placement & now trying to generate the payroll with placement, delete the exisitng entry and store the new entry. */
                let payrollExists = await indexRepository.find('payroll', ['id'], { employee_id: employee[item].id, global_search: `"placement_id" is null`, payroll_configuration_id: condition.id }, 1, []);
                if (payrollExists.status) {
                    await transactionRepository.destroy(trx, 'payroll', { id: payrollExists.data[0].id });

                    let newPayrollPaymentData = {
                        employee_id: employee[item].id,
                        payroll_configuration_id: condition.id,
                    }
                    await transactionRepository.destroy(trx, 'payroll_payment_details', newPayrollPaymentData);
                }
                /* If payroll already generated without placement & now trying to generate the placement with placement, delete the exisitng entry and store the new entry. */

                placements = placementData.data
                /**
                 * Calculates the previous complete hours based on the payroll configuration type of the first placement in the given array.
                 * If the payroll configuration type is 2, it calls the getSinglePlacementTotalHours function to get the total hours for the placement.
                 * Otherwise, it checks if the placement has the hours_worked property and assigns its value to previousCompleteHours. If the property is not present, it assigns 0 to previousCompleteHours.
                 * @param {Array} placements - An array of placement objects.
                 * @returns {number} The previous complete hours.
                 */
                if (placements[0].payroll_configuration_type == 2) {  // Custom Configuration  
                    previousCompleteHours = await getSinglePlacementTotalHours(placements[0].id);
                } else {  // Global Configuration
                    previousCompleteHours = placements[0].hours_worked ? placements[0].hours_worked : 0; // Previous worked hours
                }

                let total_worked_hours = 0;
                let total_payroll_amount = 0;
                let totalOtHours = 0;
                let totalBillableHours = 0;

                /**
                 * Calculates payroll and updates timesheet hours for each placement in the given placements object.
                 * Once stored the placement wise payroll information creating a new entry in placement payment details for each employee on that particular period of payroll
                 */
                for (const key in placements) {
                    let total_amount = 0;

                    /* Checking all the employees time sheets are approved successfully for the given payroll period */
                    const fields = ['timesheet_hours.id', 'ts.status']

                    const joins = [
                        { table: 'timesheets as ts', alias: 'ts', condition: ['timesheet_hours.timesheet_id', 'ts.id'] },
                        { table: 'placements as pla', alias: 'pla', condition: ['ts.placement_id', 'pla.id'] },
                    ];

                    const tsFetchConditions = { 'timesheet_hours.payroll_raised': false, 'pla.employee_id': employee[item].id, 'pla.id': placements[key].id, 'global_search': `"timesheet_hours"."date" >= '${moment(payroll.from_date).format('YYYY-MM-DD')}' and "timesheet_hours"."date" <= '${moment(payroll.to_date).format('YYYY-MM-DD')}' and "ts"."status" NOT IN ('Approved')` }

                    var checkAllTsApproved = await indexRepository.find('timesheet_hours', fields, tsFetchConditions, null, joins);
                    /* Checking all the employees time sheets are approved successfully for the given payroll period */

                    /**
                     * If all timesheets in the payperiod approved 
                     */
                    if (!checkAllTsApproved.status) {

                        let current_hours = 0.00;
                        let timesheets_array = [];

                        /* Fetching the total hours for the current placement based on payroll data */
                        //Fields to fetch
                        let timesheetHoursDataFields = ['SUM("timesheet_hours"."billable_hours") as total_billable_hours, SUM("timesheet_hours"."ot_hours") as total_ot_hours, SUM("timesheet_hours"."total_hours") as total_hours, "timesheet_hours"."date", "timesheet_hours"."id"'];

                        // Table Join Condition
                        let timesheetHoursDataJoins = [
                            { table: 'timesheets as ts', alias: 'ts', condition: ['timesheet_hours.timesheet_id', 'ts.id'], type: 'inner' },
                        ];

                        // Timesheet conditions
                        let timesheetHoursDataCondition = {
                            'ts.placement_id': placements[key].id, 'ts.status': 'Approved',
                            'global_search': `"timesheet_hours"."date" >= '${moment(payrollData.data[0].from_date).format('YYYY-MM-DD')}' and "timesheet_hours"."date" <= '${moment(payrollData.data[0].to_date).format('YYYY-MM-DD')}'`
                        }

                        // Fetch the hours information
                        var timesheetHoursData = await indexRepository.findRaw('timesheet_hours', timesheetHoursDataFields, timesheetHoursDataCondition, null, timesheetHoursDataJoins, null, 'id', 'asc', true, ['timesheet_hours.date', 'timesheet_hours.id', 'timesheet_hours.timesheet_id']);
                        /* Fetching the total hours for the current placement based on payroll data */

                        if (timesheetHoursData.status) {
                            timesheetData = timesheetHoursData.data  // Fetching the Timesheet data
                            for (const k in timesheetData) {
                                let total_billable_hours;
                                let total_billable_minutes;
                                let total_ot_hours;
                                let total_ot_minutes;

                                /**
                                 * Calculates the total billable hours and minutes based on the timesheet data.
                                 * If the timesheet data has a `total_hours` property, it will use the `total_billable_hours`
                                 * and `total_billable_minutes` properties to calculate the total billable time.
                                 * If the `total_hours` property is not present, the total billable time will be set to 0.
                                 * @param {Object} timesheetData - The timesheet data object.
                                 * @returns {Object} An object containing the total billable hours and minutes.
                                 */
                                if (timesheetData[k].total_hours) {
                                    total_billable_hours = timesheetData[k].total_billable_hours.hours ? Number(timesheetData[k].total_billable_hours.hours) : 0;
                                    total_billable_hours = total_billable_hours;

                                    total_billable_minutes = timesheetData[k].total_billable_hours.minutes ? Number(timesheetData[k].total_billable_hours.minutes) : 0;
                                    total_billable_minutes = (total_billable_minutes / 60);
                                } else {
                                    total_billable_hours = 0;
                                    total_billable_minutes = 0;
                                }

                                /**
                                 * Calculates the total overtime hours and minutes based on the timesheet data.
                                 * If the timesheet data contains a valid total overtime hours value, it will be
                                 * converted to a number and assigned to the variable total_ot_hours. If the timesheet
                                 * data contains a valid total overtime minutes value, it will be converted to a number
                                 * and assigned to the variable total_ot_minutes. If the timesheet data does not contain
                                 * a valid total overtime hours value, total_ot_hours will be set to 0. If the timesheet
                                 * data does not contain a valid total overtime minutes value, total_ot_minutes will be
                                 * set to 0.
                                 * @param {Object} timesheetData - The timesheet
                                 */
                                if (timesheetData[k].total_ot_hours) {
                                    total_ot_hours = timesheetData[k].total_ot_hours.hours ? Number(timesheetData[k].total_ot_hours.hours) : 0;
                                    total_ot_hours = total_ot_hours;

                                    total_ot_minutes = timesheetData[k].total_ot_hours.minutes ? Number(timesheetData[k].total_ot_hours.minutes) : 0;
                                    total_ot_minutes = (total_ot_minutes / 60);
                                } else {
                                    total_ot_hours = 0;
                                    total_ot_minutes = 0;
                                }

                                /* Total Billabele Hours and Minutes Bifurcation */

                                let total_approved_hours1 = total_billable_hours + total_billable_minutes;
                                let total_approved_hours = parseFloat(total_approved_hours1).toFixed(2);
                                current_hours += parseFloat(total_approved_hours1);

                                /* Total ot Hours and Minutes Bifurcation */
                                let total_ot_approved_hours1 = total_ot_hours + total_ot_minutes;
                                let total_ot_approved_hours = parseFloat(total_ot_approved_hours1).toFixed(2);
                                current_hours += parseFloat(total_ot_approved_hours1);

                                /* getting current bill rate */
                                let currentBillRateCondition = { placement_id: placements[key].id, 'global_search': `(effective_from <= '${moment(timesheetData[k].date).format('YYYY-MM-DD')}' and(effective_to >= '${moment(timesheetData[k].date).format('YYYY-MM-DD')}' or effective_to is null))` };

                                // Fields to fetch
                                let placementBillingData1Fields = ['bill_rate', 'ot_bill_rate', 'ot_pay_rate_config_type', 'ot_pay_rate_multiplier', 'ot_pay_rate', 'bill_rate_discount', 'bill_rate_discount_type'];

                                // Function to fetch the current bill rate information
                                var placementBillingData1 = await indexRepository.find('placement_billing_details', placementBillingData1Fields, currentBillRateCondition);

                                if (placementBillingData1.status) {
                                    billRate = placementBillingData1.data[0].bill_rate;

                                    otBillRate = placementBillingData1.data[0].ot_bill_rate ? placementBillingData1.data[0].ot_bill_rate : 0;

                                    otPayConfigType = placementBillingData1.data[0].ot_pay_rate_config_type ? placementBillingData1.data[0].ot_pay_rate_config_type : 1; // setting same as pay rate

                                    otPayrateMultiplier = placementBillingData1.data[0].ot_pay_rate_multiplier ? placementBillingData1.data[0].ot_pay_rate_multiplier : null;

                                    otPayrate = placementBillingData1.data[0].ot_pay_rate ? placementBillingData1.data[0].ot_pay_rate : 0;

                                    bill_rate_discount_type = placementBillingData1.data[0].bill_rate_discount_type ? placementBillingData1.data[0].bill_rate_discount_type : null;

                                    bill_rate_discount = placementBillingData1.data[0].bill_rate_discount ? placementBillingData1.data[0].bill_rate_discount : 0;

                                } else {
                                    billRate = null;
                                    otPayConfigType = 1;  // setting same as pay rate
                                    otPayrateMultiplier = null;
                                    otPayrate = null;
                                    otBillRate = null;
                                    bill_rate_discount = null;
                                    bill_rate_discount_type = null;
                                }
                                /* getting current bill rate */

                                let date = moment(timesheetData[k].date).format('YYYY-MM-DD');

                                let billingDetails = {
                                    hours: total_approved_hours,
                                    bill_rate: billRate,
                                    tsh_id: timesheetData[k].id,
                                    date: date,
                                    ot_hours: total_ot_approved_hours,
                                    ot_pay_rate_config_type: otPayConfigType,
                                    ot_pay_rate_multiplier: otPayrateMultiplier,
                                    ot_pay_rate: otPayrate,
                                    ot_bill_rate: otBillRate,
                                    bill_rate_discount: bill_rate_discount,
                                    bill_rate_discount_type: bill_rate_discount_type
                                }

                                // adding hours, id and bill_rate to a array of objects
                                timesheets_array.push(billingDetails)
                            }
                        }

                        /**
                         * Calculates the payroll for a given employee and placement based on the provided data.
                         * If no currenct hours found just store the information with zero values
                         */
                        if (current_hours > 0) {
                            var payType = placements[key].pay_type
                            // getting pay rate data

                            // Fields to fetch
                            let payRateDataFields = ['pay_rate_configuration.id', 'pay_rate_configuration.pay_in', 'pay_rate_configuration.from_hour', 'pay_rate_configuration.to_hour', 'pay_rate_configuration.rate'];

                            // Joins for the query
                            let payRateDataJois = [
                                { table: 'pay_type_configuration as ptc', alias: 'ptc', condition: ['ptc.id', 'pay_rate_configuration.pay_type_configuration_id'], type: 'left' },
                            ];

                            //Data fetch condition
                            payRateDataCondition = { 'pay_rate_configuration.pay_type_configuration_id': placements[key].pay_type_configuration_id };
                            var payRateData = await indexRepository.find('pay_rate_configuration', payRateDataFields, payRateDataCondition, null, payRateDataJois, null, 'id', 'asc', false)
                            var payRate = payRateData.data
                            // caluclating the pay for the hours worked
                            // for hourly pay (pay type =2)

                            let tshAmount = []; // array to store the day wise amount generated

                            /**
                             * Calculates the total hours, total pay, total bill pay, and pay rate array based on the pay type.
                             */
                            if (payType === 2) {  //  2 for Hourly
                                //var dailyPay = [totalHours => 0, totalpay => 0, PayRateArray => []];
                                var totalHours = 0;
                                var totalPay = 0;
                                var PayRateArray = [];
                                var i = 0;

                                // looping through timesheet hours array
                                timesheets_array.forEach(ts => {

                                    // getting totalHours and totalPay for every iteration
                                    let dailyP = calculatePayRates(ts.hours, ts.bill_rate, payRate, previousCompleteHours, ts.date, ts.ot_hours, ts.ot_pay_rate_config_type, ts.ot_pay_rate_multiplier, ts.ot_pay_rate, ts.ot_bill_rate, ts.bill_rate_discount, ts.bill_rate_discount_type);

                                    previousCompleteHours += ((ts.hours ? parseFloat(ts.hours) : 0) + (ts.ot_hours ? parseFloat(ts.ot_hours) : 0)) // adding the hours to previous complete hours

                                    totalHours += (dailyP.totalHours ? parseFloat(dailyP.totalHours) : 0); // Total hours i.e billable + ot

                                    totalPay += (dailyP.totalPay ? parseFloat(dailyP.totalPay) : 0); // Total pay i.e billable + ot

                                    /**
                                     * Defining the total hours and ot hours and pay rate and ot payrate for the current payroll
                                     */
                                    totalOtHours += (dailyP.totalOtHours ? parseFloat(dailyP.totalOtHours) : 0);
                                    totalBillableHours += (dailyP.totalBillableHours ? parseFloat(dailyP.totalBillableHours) : 0);

                                    if (dailyP.PayRateArray.length > 0) {
                                        PayRateArray[i] = dailyP.PayRateArray;
                                        i++;
                                    }

                                    /**
                                     * Updating payable amount for each day
                                     */
                                    tshData = {
                                        id: ts.tsh_id,
                                        amount: (dailyP.totalPay ? parseFloat(dailyP.totalPay) : 0)
                                    }
                                    tshAmount.push(tshData)
                                });
                                var dailyPay = { totalHours: totalHours, totalPay: totalPay, PayRateArray: PayRateArray }

                            }
                            // for salary pay 
                            else {
                                var totalHours = 0;

                                /**
                                 * Iterating the 
                                 */
                                timesheets_array.forEach(ts => {
                                    previousCompleteHours += ((ts.hours ? parseFloat(ts.hours) : 0) + (ts.ot_hours ? parseFloat(ts.ot_hours) : 0))

                                    totalHours += ((ts.hours ? parseFloat(ts.hours) : 0) + (ts.ot_hours ? parseFloat(ts.ot_hours) : 0))

                                    /**
                                     * Defining the total hours and ot hours and pay rate and ot payrate for the current payroll
                                     */
                                    totalOtHours += (ts.ot_hours ? parseFloat(ts.ot_hours) : 0);
                                    totalBillableHours += (ts.hours ? parseFloat(ts.hours) : 0);
                                });

                                /**
                                 * Approximately calculating the per day value for the salary or permanent payroll employee
                                 */
                                var tsCount = timesheets_array.length;
                                // distribution of total value for every record
                                var payPerVal = parseFloat(placements[key].payroll_pay / tsCount);
                                timesheets_array.forEach(ts => {
                                    tshData = {
                                        id: ts.tsh_id,
                                        amount: payPerVal.toFixed(2)
                                    }
                                    // adding timesheethours id and respective amount
                                    tshAmount.push(tshData)
                                });

                                let temp_payroll = parseFloat(placements[key].payroll_pay);
                                var dailyPay = { totalHours: totalHours, totalPay: temp_payroll, billRate: timesheets_array[0].bill_rate }
                            }

                            total_worked_hours += dailyPay.totalHours ? parseFloat(dailyPay.totalHours) : parseFloat(current_hours); // Total hours for that payroll period. 

                            total_amount = dailyPay.totalPay ? parseFloat(dailyPay.totalPay) : 0;// Total amount for that payroll period
                            total_payroll_amount += total_amount;

                            /**
                             * Formaing the hours pay rate calculated object
                             */
                            let hoursPayRateObject;
                            if (dailyPay.PayRateArray) { // Hours 
                                if (dailyPay.PayRateArray.length > 0) {
                                    hoursPayRateObject = JSON.stringify(dailyPay.PayRateArray);
                                } else {
                                    hoursPayRateObject = JSON.stringify([{ "hours": current_hours.toFixed(2), "amount_payable": dailyPay.totalPay.toFixed(2), "pay_in": "Hourly", "pay_rate": [] }])
                                }
                            } else { // Salary
                                hoursPayRateObject = JSON.stringify([[{ "hours": dailyPay.totalHours, "amount_payable": dailyPay.totalPay.toFixed(2), "pay_in": "Salary", "pay_rate": "", "total_hours": dailyPay.totalHours, "bill_rate": dailyPay.billRate }]])
                            }

                            /**
                             * Insert / Update payroll details with hoursPayRateObject for column hours_rate_information
                             */
                            let payrollExists = await indexRepository.find('payroll', ['id'], { employee_id: employee[item].id, placement_id: placements[key].id, payroll_configuration_id: condition.id }, 1, []);
                            if (payrollExists.status) {
                                // object to store in the db
                                var newPayrollConfig = {
                                    timesheet_approval_pending: false,
                                    hours_rate_information: hoursPayRateObject,
                                    total_amount: parseFloat(total_amount).toFixed(2),
                                    updated_by: body.updated_by,
                                    updated_at: new Date()
                                };
                                await transactionRepository.update(trx, 'payroll', { id: payrollExists.data[0].id }, newPayrollConfig);
                            } else {
                                // object to store in the db
                                var newPayrollConfig = {
                                    employee_id: employee[item].id,
                                    placement_id: placements[key].id,
                                    timesheet_approval_pending: false,
                                    total_amount: parseFloat(total_amount).toFixed(2),
                                    payroll_configuration_id: condition.id,
                                    hours_rate_information: hoursPayRateObject,
                                    created_by: body.created_by,
                                    created_at: new Date()
                                };
                                await transactionRepository.store(trx, 'payroll', newPayrollConfig);
                            }
                        }

                        /**
                         * If placement exists (project is  open and  within date range) & current_hours less then 0, we handle their payroll as follows:
                         * 1. Check for an existing payroll entry. If found, update it with 'updated_by' and 'updated_at' details.
                         * 2. If no existing entry is found, create a new payroll entry.
                         */
                        else {
                            /**
                             * Insert / Update payroll details
                             */
                            let payrollExists = await indexRepository.find('payroll', ['id'], { employee_id: employee[item].id, placement_id: placements[key].id, payroll_configuration_id: condition.id }, 1, []);
                            if (payrollExists.status) {
                                // update object
                                var newPayrollConfig = {
                                    timesheet_approval_pending: false,
                                    updated_by: body.updated_by,
                                    updated_at: new Date()
                                };
                                await transactionRepository.update(trx, 'payroll', { id: payrollExists.data[0].id }, newPayrollConfig);
                            } else {
                                // object to store in the db
                                var newPayrollConfig = {
                                    employee_id: employee[item].id,
                                    placement_id: placements[key].id,
                                    payroll_configuration_id: condition.id,
                                    created_by: body.created_by,
                                    created_at: new Date()
                                };
                                await transactionRepository.store(trx, 'payroll', newPayrollConfig);
                            }
                        }
                    }
                    /**
                    * If the employees timesheets are not  approved, we handle their payroll & payroll_payment_details as follows:
                    * 1. Check for an existing payroll entry. If found, update it with 'updated_by' and 'updated_at' details.
                    * 2. If no existing entry is found, create a new payroll entry.
                    * 3. Update / create payroll payment details. If an existing entry is found, update it. If not, store payroll payment details.
                    * 4. Calculate then store / update the worked_hours and total_amount as 0 for the employee's payroll_payment_details.
                    */
                    else {
                        /**
                         * Insert / Update payroll details
                         */
                        let payrollExists = await indexRepository.find('payroll', ['id'], { employee_id: employee[item].id, placement_id: placements[key].id, payroll_configuration_id: condition.id }, 1, []);
                        if (payrollExists.status) {
                            var newPayrollConfig = {
                                timesheet_approval_pending: true,
                                updated_by: body.updated_by,
                                updated_at: new Date()
                            };
                            await transactionRepository.update(trx, 'payroll', { id: payrollExists.data[0].id }, newPayrollConfig);
                        } else {
                            var newPayrollConfig = {
                                employee_id: employee[item].id,
                                placement_id: placements[key].id,
                                timesheet_approval_pending: true,
                                payroll_configuration_id: condition.id,
                                created_by: body.created_by,
                                created_at: new Date()
                            };
                            await transactionRepository.store(trx, 'payroll', newPayrollConfig);
                        }
                    }
                }

                /**
                * Inserts/ update payroll payment details.
                */
                let payrollPaymentExists = await indexRepository.find('payroll_payment_details', ['id'], { employee_id: employee[item].id, payroll_configuration_id: condition.id }, 1, []);
                if (payrollPaymentExists.status) {
                    let newPayrollPaymentData = {
                        total_amount: parseFloat(total_payroll_amount).toFixed(2), // Total amoun need to pay for this payroll
                        worked_hours: total_worked_hours.toFixed(2), // Including the billable  + ot
                        updated_by: body.updated_by,
                        updated_at: new Date(),
                    }
                    await transactionRepository.update(trx, 'payroll_payment_details', { id: payrollPaymentExists.data[0].id }, newPayrollPaymentData);
                } else {
                    let newPayrollPaymentData = {
                        employee_id: employee[item].id,
                        payroll_configuration_id: condition.id,
                        worked_hours: total_worked_hours.toFixed(2), // Including the billable  + ot
                        total_amount: parseFloat(total_payroll_amount).toFixed(2), // Total amoun need to pay for this payroll
                        balance_amount: parseFloat(total_payroll_amount).toFixed(2),  // default setting the total_amount as billable amount
                        created_by: body.created_by,
                        created_at: new Date(),
                    }
                    await transactionRepository.store(trx, 'payroll_payment_details', newPayrollPaymentData);
                }
            }
            /**
             * If placement not exists (project is completed and not within date range), we handle their payroll & payroll_payment_details as follows:
             * 1. Check for an existing payroll entry. If found, update it with 'updated_by' and 'updated_at' details.
             * 2. If no existing entry is found, create a new payroll entry.
             * 3. Update / create payroll payment details. If an existing entry is found, update it. If not, store payroll payment details.
             * 4. Calculate then store / update the worked_hours and total_amount as 0 for the employee's payroll_payment_details.
             */
            else {
                /**
                 * Insert / Update payroll details
                 */
                let payrollExists = await indexRepository.find('payroll', ['id'], { employee_id: employee[item].id, global_search: `"placement_id" is null`, payroll_configuration_id: condition.id }, 1, []);
                if (payrollExists.status) {
                    var newPayrollConfig = {
                        updated_by: body.updated_by,
                        updated_at: new Date()
                    };
                    await transactionRepository.update(trx, 'payroll', { id: payrollExists.data[0].id }, newPayrollConfig);
                } else {
                    var newPayrollConfig = {
                        employee_id: employee[item].id,
                        placement_id: null,
                        payroll_configuration_id: condition.id,
                        created_by: body.created_by,
                        created_at: new Date()
                    };
                    await transactionRepository.store(trx, 'payroll', newPayrollConfig);
                }

                /**
                * Inserts/ update payroll payment details.
                */
                let payrollPaymentExists = await indexRepository.find('payroll_payment_details', ['id'], { employee_id: employee[item].id, payroll_configuration_id: condition.id }, 1, []);
                if (payrollPaymentExists.status) {
                    let newPayrollPaymentData = {
                        total_amount: 0.00,
                        worked_hours: 0.00,
                        // timesheet_approval_pending: false,
                        updated_by: body.updated_by,
                        updated_at: new Date(),
                    }
                    await transactionRepository.update(trx, 'payroll_payment_details', { id: payrollPaymentExists.data[0].id }, newPayrollPaymentData)
                } else {
                    let newPayrollPaymentData = {
                        employee_id: employee[item].id,
                        payroll_configuration_id: condition.id,
                        // timesheet_approval_pending: false,
                        total_amount: 0.00,
                        balance_amount: 0.00,
                        worked_hours: 0.00,
                        created_by: body.created_by,
                        created_at: new Date(),
                    }
                    await transactionRepository.store(trx, 'payroll_payment_details', newPayrollPaymentData)
                }
            }
            // }
        }

        // Commit the transaction
        await trx.commit();
        return { status: true }
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Calculate pay rates based on provided parameters.
 *
 * @param {number} dailyHours - Hours worked in a day.
 * @param {number} billRate - Base billing rate.
 * @param {Array} payRates - Array of pay rate configurations.
 * @param {number} previousCompleteHours - Hours worked in previous shifts.
 * @param {string} date - Date for which pay rates are calculated.
 * @param {number} otHours - Overtime hours.
 * @param {number} otPayConfigType - Overtime pay configuration type (1: Same as pay rate, 2: Fixed rate, 3: Multiplier).
 * @param {number} otPayrateMultiplier - Multiplier for overtime pay rate.
 * @param {number} otPayRate - Fixed rate for overtime pay.
 * @param {number} otBillRate - Overtime billing rate.
 * @param {number} billRateDiscount - Discount applied to the billing rate.
 * @param {number} bill_rate_discount_type - Type of billing rate discount (1: Percentage, 2: Value).
 *
 * @returns {Object} - Object containing calculated pay rate details.
 */
function calculatePayRates(dailyHours, billRate, payRates, previousCompleteHours, date, otHours, otPayConfigType, otPayrateMultiplier, otPayRate, otBillRate, billRateDiscount, bill_rate_discount_type) {

    /**
     * Define variables
     */
    const totalHoursWorked = parseFloat(dailyHours) + previousCompleteHours; // hours worked till now

    let othours = parseFloat(otHours)
    let ot_pay_rate = 0
    let pay = 0;
    let otPay = 0;
    let remainingHours = totalHoursWorked;
    let PayRateArray = [];
    let totalPay = 0;
    let totalHours = 0;
    let otCalculated = 0;
    let pay_rate = 0;
    let totalOtHours = 0;
    let totalOtPayrate = 0;
    let totalBillableHours = 0;
    let totalBillablePayRate = 0;

    // looping for every pay rate depending on hours
    payRates.forEach(payRate => {
        const rate = parseFloat(payRate.rate); // rate value 
        const hours = [payRate.from_hour, payRate.to_hour]; // Creating the from and to hours array
        var rateHours = Math.min(remainingHours, hours[1] || Infinity) - Math.max(previousCompleteHours, hours[0] - 1); // Based on the previous hours calculating the hours remaing hours that fall under the pay slap

        if (rateHours > 0) {
            otCalculated = otCalculated + 1;  // Skip the ot calculation from second iteration onwards;
            let pay;

            if (payRate.pay_in == 1) {  // 1 for percentage type pay rate

                // Calculating bill rate after applyig the discount factor
                if (bill_rate_discount_type && billRateDiscount) {
                    if (bill_rate_discount_type == 1) { // 1 for percentage type
                        let billRateDiscointValue = (billRate * billRateDiscount) / 100;
                        billRate = billRate - billRateDiscointValue
                    } else {
                        let billRateDiscointValue = (billRate - billRateDiscount);
                        billRate = billRateDiscointValue
                    }
                }

                val = ((rate * billRate) / 100) // based on the percentage calculate the payrate
                pay = val * rateHours;
                totalPay += (val * rateHours);    // Payamount for the billed hours
                totalHours += rateHours;
                pay_rate = val;  // Payrate
                totalBillableHours += rateHours;
                totalBillablePayRate = val;

                /**
                 * Calculating the otpayrate
                 */
                if (otPayConfigType && otCalculated === 1) {
                    if (otPayConfigType === 1) {  // same as pay rate
                        ot_pay_rate = val;

                        let otBillRateDiscointValue = null;
                        // Calculating bill rate after applyig the discount factor
                        if (bill_rate_discount_type && billRateDiscount) {
                            if (bill_rate_discount_type == 1) { // 1 for percentage type
                                otBillRateDiscointValue = (ot_pay_rate * billRateDiscount) / 100;
                                ot_pay_rate = (ot_pay_rate - otBillRateDiscointValue)
                            } else {
                                otBillRateDiscointValue = (ot_pay_rate - billRateDiscount);
                                ot_pay_rate = otBillRateDiscointValue
                            }
                        }

                        otPay = (ot_pay_rate * othours);
                        totalPay += (ot_pay_rate * othours);
                    } else if (otPayConfigType === 2) {  //fixed ot payrate
                        ot_pay_rate = otPayRate;

                        let otBillRateDiscointValue = null;
                        // Calculating bill rate after applyig the discount factor
                        if (bill_rate_discount_type && billRateDiscount) {
                            if (bill_rate_discount_type == 1) { // 1 for percentage type
                                otBillRateDiscointValue = (ot_pay_rate * billRateDiscount) / 100;
                                ot_pay_rate = (ot_pay_rate - otBillRateDiscointValue)
                            } else {
                                otBillRateDiscointValue = (ot_pay_rate - billRateDiscount);
                                ot_pay_rate = otBillRateDiscointValue
                            }
                        }

                        otPay = (otPayRate * othours);
                        totalPay += (otPayRate * othours);
                    } else if (otPayConfigType === 3) {   // multiplier ot pay rate
                        ot_pay_rate = val * otPayrateMultiplier;

                        let otBillRateDiscointValue = null;
                        // Calculating bill rate after applyig the discount factor
                        if (bill_rate_discount_type && billRateDiscount) {
                            if (bill_rate_discount_type == 1) { // 1 for percentage type
                                otBillRateDiscointValue = (ot_pay_rate * billRateDiscount) / 100;
                                ot_pay_rate = (ot_pay_rate - otBillRateDiscointValue)
                            } else {
                                otBillRateDiscointValue = (ot_pay_rate - billRateDiscount);
                                ot_pay_rate = otBillRateDiscointValue
                            }
                        }

                        otPay = (ot_pay_rate * othours)
                        totalPay += (ot_pay_rate * othours)
                    }
                    totalOtHours += othours;
                    totalOtPayrate = ot_pay_rate;
                    totalHours += otPay;
                } else {
                    othours = 0;
                }
            } else {  // payrate in fixed values

                val = rate
                totalPay += rate * rateHours;
                pay = rate * rateHours;
                totalHours += (rateHours);
                pay_rate = rate;
                totalBillableHours += rateHours;
                totalBillablePayRate = val;

                if (otPayConfigType && otCalculated === 1) {
                    if (otPayConfigType === 1) {
                        ot_pay_rate = rate
                        otPay = (ot_pay_rate * othours)
                        totalPay += (otPay * othours)
                    } else if (otPayConfigType === 2) {
                        ot_pay_rate = otPayRate
                        otPay = (ot_pay_rate * othours)
                        totalPay += (otPayRate * othours)
                    } else if (otPayConfigType === 3) {
                        ot_pay_rate = val * otPayrateMultiplier
                        otPay = (ot_pay_rate * othours)
                        totalPay += (ot_pay_rate * othours)
                    }
                    totalOtHours += othours;
                    totalOtPayrate = ot_pay_rate;
                    totalHours += othours;
                } else {
                    othours = 0;
                }
            }

            //remainingHours -= rateHours;
            var payRateobj = {
                date: date,
                bill_rate: billRate,
                ot_bill_rate: otBillRate,
                hours: parseFloat(rateHours).toFixed(2), // billed hours
                amount_payable: parseFloat(pay).toFixed(2),  //bill amount payable
                pay_in: payRate.pay_in == 1 ? 'Percentage' : 'Value',
                pay_rate_value: rate,
                pay_rate: pay_rate,
                ot_hours: otCalculated === 1 ? parseFloat(othours).toFixed(2) : 0.00,
                ot_pay_rate: ot_pay_rate ? parseFloat(ot_pay_rate).toFixed(2) : 0.00,
                ot_amount_payable: otCalculated === 1 ? parseFloat(otPay).toFixed(2) : 0.00,
                total_hours: parseFloat(rateHours + othours).toFixed(2), // total hours i.e. bill + ot
                total_amount_payable: parseFloat(pay + (otCalculated === 1 ? otPay : 0)).toFixed(2),
                bill_rate_discount: billRateDiscount,
                bill_rate_discount: bill_rate_discount_type
            }
            previousCompleteHours += rateHours;
            PayRateArray.push(payRateobj);
        }
    });

    return { PayRateArray, totalPay, totalHours, totalOtHours, totalOtPayrate, totalBillableHours, totalBillablePayRate };
}


/**
 * Function to calculate the total hours for a placement based on approved timesheet data.
 *
 * @param {string} placement_id - The ID of the placement for which total hours are calculated.
 *
 * @returns {number} - The total completed hours for the specified placement.
 *
 * Logic:
 * - Define a variable 'totalPlacementCompletedHours' to store the total completed hours for the placement.
 * 
 * - Define fields to fetch from the 'timesheet_hours' table (total hours).
 * 
 * - Define tables to join (join with 'timesheets' table).
 * 
 * - Define a condition to filter timesheet hours data based on placement ID and payroll_raised flag.
 * 
 * - Query the database to get timesheet hours data for the specified placement.
 * 
 * - Iterate over the retrieved timesheet data:
 *   - For each timesheet entry, calculate the total hours (hours + minutes converted to hours) and add it to 'totalPlacementCompletedHours'.
 * 
 * - Return the calculated 'totalPlacementCompletedHours'.
 */
const getSinglePlacementTotalHours = async (placement_id) => {

    let totalPlacementCompletedHours = 0;

    // Fields to fetch
    let timesheetHoursDataFields = ['SUM("timesheet_hours"."total_hours") as total_hours']

    // Tables to join
    let timesheetHoursDataJoins = [
        { table: 'timesheets as ts', alias: 'ts', condition: ['timesheet_hours.timesheet_id', 'ts.id'], type: 'inner' },
    ];

    // Condition
    let timesheetHoursDataCondition = { 'ts.placement_id': placement_id, 'timesheet_hours.payroll_raised': true }

    // Already approved placement hours
    var timesheetHoursData = await indexRepository.findRaw('timesheet_hours', timesheetHoursDataFields, timesheetHoursDataCondition, null, timesheetHoursDataJoins, null, null, null, true, ['timesheet_hours.date', 'timesheet_hours.id', 'timesheet_hours.timesheet_id']);

    timesheetData = timesheetHoursData.data  // Fetching the Timesheet data
    for (const k in timesheetData) {
        let total_hours;
        let total_minutes;

        if (timesheetData[k].total_hours) {
            let total_billable_hours = timesheetData[k].total_hours.hours ? Number(timesheetData[k].total_hours.hours) : 0;
            total_hours = total_billable_hours;

            total_billable_minutes = timesheetData[k].total_hours.minutes ? Number(timesheetData[k].total_hours.minutes) : 0;

            total_minutes = (total_billable_minutes / 60);
        } else {
            total_hours = 0;
            total_minutes = 0;
        }

        let total_approved_hours1 = total_hours + total_minutes;
        totalPlacementCompletedHours += parseFloat(total_approved_hours1);
    }
    return totalPlacementCompletedHours;
};

const payrollPlacementInfo = async (condition) => {

    let othoursExists = false;
    const fields = ['payroll.id', 'payroll.employee_id', 'payroll.payroll_configuration_id', 'payroll.total_amount', 'payroll.placement_id', 'payroll.hours_rate_information', 'payroll.timesheet_approval_pending', 'companies.name as client_name', 'companies.logo_document_url', 'employee.display_name as employee_name', 'placements.end_date as placement_end_date', 'payroll_configuration.to_date as payroll_to_date']
    const joins = [
        { table: 'payroll_configuration', alias: 'payroll_configuration', condition: ['payroll_configuration.id', 'payroll.payroll_configuration_id'], ignoreDeletedAt: true },
        { table: 'employee', alias: 'employee', condition: ['employee.id', 'payroll.employee_id'] },
        { table: 'placements', alias: 'placements', condition: ['placements.id', 'payroll.placement_id'] },
        { table: 'companies', alias: 'companies', condition: ['companies.id', 'placements.client_id'] }
    ];
    var payrollData = await indexRepository.find('payroll', fields, condition, 0, joins)

    if (payrollData.status) {
        /* Variables */
        var listingObject = [];
        let responseData = [];
        let dateFormat = await format.getDateFormat();
        var total_details = payrollData.data;
        /* Variables */

        /* Prepare the response */
        for (let key in total_details) {
            var item = total_details[key];
            let employeeName = item.employee_name;
            let clientName = item.client_name;
            let clientLogo = item?.logo_document_url || "";
            let temp = [];

            for (let keyss in item.hours_rate_information) {
                let temp2 = item.hours_rate_information[keyss];
                for (let paykey in temp2) {
                    let temp1 = {
                        date: temp2[paykey].date ? moment(temp2[paykey].date).format('YYYY-MM-DD') : '',
                        bill_rate: temp2[paykey].bill_rate ? temp2[paykey].bill_rate : 0,
                        ot_bill_rate: temp2[paykey].ot_bill_rate ? temp2[paykey].ot_bill_rate : 0,
                        hours: temp2[paykey].hours ? temp2[paykey].hours : 0,
                        pay_type: temp2[paykey].pay_in ? temp2[paykey].pay_in : '-',
                        pay_rate: temp2[paykey].pay_rate ? parseFloat(temp2[paykey].pay_rate).toFixed(2) : 0,
                        amount_payable: temp2[paykey].amount_payable ? temp2[paykey].amount_payable : 0,
                        ot_hours: temp2[paykey].ot_hours ? temp2[paykey].ot_hours : 0,
                        ot_pay_rate: temp2[paykey].ot_pay_rate ? temp2[paykey].ot_pay_rate : 0,
                        ot_amount_payable: temp2[paykey].ot_amount_payable ? temp2[paykey].ot_amount_payable : 0,
                        total_hours: temp2[paykey].total_hours ? temp2[paykey].total_hours : 0,
                        total_amount_payable: temp2[paykey].total_amount_payable ? temp2[paykey].total_amount_payable : 0,
                    }
                    if (temp1.pay_type != '-') {

                        if(temp1.pay_type == 'Salary'){
                            temp1.total_amount_payable = temp2[paykey].amount_payable ? temp2[paykey].amount_payable : 0
                        }
                        /**
                         * If the same pay rate ad ot pay rates exists then summary the hours and rates
                         */
                        let existingObjectIndex = temp.findIndex((obj) => {
                            return (JSON.stringify(obj.pay_rate) === JSON.stringify(temp1.pay_rate) && JSON.stringify(obj.ot_bill_rate) === JSON.stringify(temp1.ot_bill_rate) && JSON.stringify(obj.bill_rate) === JSON.stringify(temp1.bill_rate) && JSON.stringify(obj.ot_pay_rate) === JSON.stringify(temp1.ot_pay_rate));
                        });

                        if (existingObjectIndex !== -1) {

                            let abc = temp.length;
                            let tempDate;
                            if (abc) {
                                if (temp[abc - 1].date.includes("/")) {
                                    tempDate = temp[abc - 1].date.split(" - ")[0]
                                    tempDate = tempDate.split(" - ")[0]

                                    tempDate = moment(tempDate, dateFormat).format('YYYY-MM-DD');

                                } else if (temp[abc - 1].date.includes("-")) {
                                    tempDate = temp[abc - 1].date.split(" - ")[0]
                                } else {
                                    tempDate = null;
                                }
                            } else {
                                tempDate = null;
                            }

                            let tempDate1 = temp1.date
                            temp[existingObjectIndex].date = tempDate ? (moment(tempDate).format(dateFormat) + ' - ' + moment(tempDate1).format(dateFormat)) : moment(tempDate1).format(dateFormat);

                            temp[existingObjectIndex].hours = (parseFloat(temp[existingObjectIndex].hours) + parseFloat(temp1.hours)).toFixed(2); // Update the existing object's hours value

                            temp[existingObjectIndex].amount_payable = (parseFloat(temp[existingObjectIndex].amount_payable) + parseFloat(temp1.amount_payable)).toFixed(2); // Update the existing object's amount_payable value

                            temp[existingObjectIndex].ot_hours = (parseFloat(temp[existingObjectIndex].ot_hours) + parseFloat(temp1.ot_hours)).toFixed(2); // OT hours summing

                            temp[existingObjectIndex].ot_amount_payable = (parseFloat(temp[existingObjectIndex].ot_amount_payable) + parseFloat(temp1.ot_amount_payable)).toFixed(2); // OT payable summing


                            temp[existingObjectIndex].total_amount_payable = (parseFloat(temp[existingObjectIndex].total_amount_payable) + parseFloat(temp1.total_amount_payable)).toFixed(2);

                            temp[existingObjectIndex].total_hours = (parseFloat(temp[existingObjectIndex].total_hours) + parseFloat(temp1.total_hours)).toFixed(2);

                        } else {
                            temp.push(temp1); //adding temp1 object in temp array
                        }
                    }
                }
            }

            let placement_status;
            let placement_label;
            let placement_end_dt;
            if (item.placement_end_date) {
                if (moment(item.payroll_to_date).format('YYYY/MM/DD') < moment(item.placement_end_date).subtract(1, 'months').format('YYYY/MM/DD')) {
                    placement_status = 2;
                    placement_end_dt = moment(item.placement_end_date).format(dateFormat);
                    placement_label = 'Going To End';
                } else {
                    placement_status = 3;
                    placement_end_dt = moment(item.placement_end_date).format(dateFormat);
                    placement_label = 'Ended';
                }
            } else {
                placement_status = 1;
                placement_end_dt = ''
                placement_label = 'Active';
            }

            listingObject = {
                id: item.id,
                payroll_configuration_id: item.payroll_configuration_id,
                employee_name: employeeName,
                amount: item.total_amount ? parseFloat(item.total_amount).toFixed(2) : 0.00,
                client_name: clientName,
                client_logo: clientLogo,
                placement_label: placement_label,
                placement_status: placement_status,
                placement_end_date: placement_end_dt,
                payroll_information: temp,
                timesheet_approval_pending: item.timesheet_approval_pending
            }
            responseData.push(listingObject);
        }
        return { status: true, data: responseData, othours_exists: othoursExists };
    } else {
        return payrollData;
    }
};

/**
 * Fetches payment details for payroll listings based on conditions, pagination, and other data retrieval.
 *
 * @param {object} condition - Conditions for filtering payments.
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Limit of items per page for pagination.
 * @returns {object} - Result containing payment details, categorized and paginated.
 *
 * Logic:
 * - Fetch payment details based on provided conditions.
 * - Process the retrieved payment details and prepare categorized response data.
 * - Calculate various aspects such as payroll period, expenses, placement status, etc.
 * - Categorize payment details based on employee types, placement status, and other criteria.
 * - Create an organized response object containing categorized payment details.
 * - Return the constructed response object along with pagination details, payroll period, and other indicators.
 */
const paymentsListing = async (condition, page, limit) => {
    let othoursExistsInPayroll = false;
    /**
     * Fetching the payment details
     */
    const fields = ['payroll_payment_details.*', 'payroll_payment_details.balance_amount as balance_amount', 'pc.from_date', 'pc.status as payroll_status', 'pc.to_date', 'emp.display_name as employee_name', 'emp.balance_amount as current_available_balance', 'emp.standard_pay_amount', 'emp.id as employee_id', 'employee_categories.name as employee_categorie_name', 'emp.status', 'emp.sub_status', 'emp.employment_type_id', 'visa_types.name as visa_type_name', 'emp.reference_id as employee_reference_id', 'emp.profile_picture_url as profile_picture_url', 'emp.gender']
    const joins = [
        { table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'payroll_payment_details.employee_id'] },
        { table: 'visa_types', alias: 'visa_types', condition: ['emp.visa_type_id', 'visa_types.id'], type: 'left' },
        { table: 'employee_categories', alias: '', condition: ['emp.employee_category_id', 'employee_categories.id'], type: 'left' },
        { table: 'payroll_configuration as pc', alias: 'pc', condition: ['pc.id', 'payroll_payment_details.payroll_configuration_id'] },
    ]
    var payrollData = await indexRepository.findByPagination('payroll_payment_details', fields, condition, joins, page, limit, 'LOWER(emp.display_name) ASC', 'raw', false)

    if (payrollData.status) {
        /* Variables */
        var listingObject = [];
        let responseData = [];
        let leftEmployeeData = [];
        let PlacementGoingToComplete = [];
        let PlacementCompleted = [];
        let internalEmployee = [];
        let w2Employee = [];
        let onezero99 = [];
        let other = [];
        let payrollPeriod;
        let finalizedEmployees = [];
        let unFinalizedEmployees = [];
        let dateFormat = await format.getDateFormat();

        var total_details = payrollData.data;
        var pagination_details = payrollData.pagination;
        let placementEndedSno = 0;
        let placementGoingToEndSno = 0;
        let leftSno = 0;
        let internalSno = 0;
        let w2Sno = 0;
        let onezero99Sno = 0;
        let otherSno = 0;
        let finalizeSno;
        let unFinalizedSno;
        /* Variables */

        /* Prepare the response */
        serial_no = (page - 1) * limit + 1;
        for (let key in total_details) {
            var item = total_details[key];

            payrollPeriod = moment(item.from_date).format(dateFormat) + ' - ' + moment(item.to_date).format(dateFormat);

            /**
             * Retrieves the payroll information for a specific employee and payroll configuration.
             * , active_projects: moment(item.from_date).format("YYYY-MM-DD") 
             */
            let placements_info = await payRollRepository.listingFind({ employee_id: item.employee_id, pay_roll_configuration_id: item.payroll_configuration_id });

            /**
             * Retrieves the count of placements for a given employee and payroll configuration.
             * @param {object} item - The item containing the employee_id and payroll_configuration_id.
             * @returns {Promise<number>} - A promise that resolves to the count of placements.
             */
            let placementCount = await payRollRepository.countPlacements({ 'pr.employee_id': item.employee_id, 'pr.payroll_configuration_id': item.payroll_configuration_id })

            let creditexpense = {status: false}
            let debitexpense = {status: false}
            let expense_available = false;
            let expense_due = 0;
            let creditExpenses = [];
            let debitExpenses = [];
            
            if(item.payroll_status == 'Submitted') {
                const fields = ['expense_transaction_track.*', 'em.expense_transaction_type']
                const joins = [
                    { table: 'expense_management as em', alias: 'em', condition: ['expense_transaction_track.expense_id', 'em.id'] }
                ]
                /**
                 * Fetch all expenses
                 */
                let expenseCondition = {
                    'expense_transaction_track.payroll_configuration_id': item.payroll_configuration_id,
                    'em.employee_id': item.employee_id
                }
                let allExpensesManagement = await indexRepository.find('expense_transaction_track', fields, expenseCondition, null, joins);

                if(allExpensesManagement.status){
                    let totalExpensesData = allExpensesManagement.data
                    for(const expense of totalExpensesData) {
                        expense_available = true;
                        if(expense.expense_transaction_type == 1) {
                            creditexpense.status = true
                            creditexpense.data = expense.amount
                        } else {
                            debitexpense.status = true
                            debitexpense.data = expense.amount
                        }
                    }
                }
            } else {
                const fields = ['expense_management.*', 'emt.name as expense_type']
                const joins = [
                    { table: 'expense_and_service_types as emt', alias: 'emt', condition: ['expense_management.expense_type_id', 'emt.id'] }
                ]

                let payrollEndDate = moment(item.to_date).format("YYYY-MM-DD");

                /**
                 * Fetch all credit expenses
                 */
                let creditCondition = {
                    'employee_id': item.employee_id,
                    'expense_effect_on': 1, // payroll effect expense 
                    "expense_transaction_type": 1,  //Reumbesmet falg
                    'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and "raised_date" <= '${payrollEndDate}'`
                }
                let creditExpensesManagement = await indexRepository.find('expense_management', fields, creditCondition, null, joins);

                /**
                 * Fetch all debit expenses
                 */
                let debitCondition = {
                    'employee_id': item.employee_id,
                    'expense_effect_on': 1, // payroll effect expense 64a42fd2-db64-4a6f-9cf8-bb9ca03d4edd
                    "expense_transaction_type": 2, //Deduction falg
                    'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and  "raised_date" <= '${payrollEndDate}'`
                }
                let debitExpensesManagement = await indexRepository.find('expense_management', fields, debitCondition, null, joins);

                creditexpense = await indexRepository.sum('expense_management', creditCondition, 'due_amount')
                debitexpense = await indexRepository.sum('expense_management', debitCondition, 'due_amount')

                /**
                 * Credit Expenses Reimbusment through payroll
                 */
                if (creditExpensesManagement.status) {
                    expense_available = true;
                    for (let keys in creditExpensesManagement.data) {
                        let expense = creditExpensesManagement.data[keys]
                        var total_deductions = await indexRepository.sum('expense_transaction_track', { expense_id: expense.id }, 'amount')
                        credit_expense_object = {
                            id: expense.id,
                            employee_id: expense.employee_id,
                            expense_type_id: expense.expense_type_id,
                            expense_type: expense.expense_type,
                            expense_transaction_type: expense.expense_transaction_type,
                            expense_effect_on: expense.expense_effect_on,
                            amount: parseFloat(expense.amount).toFixed(2),
                            due_amount: parseFloat(expense.due_amount).toFixed(2),
                            goal_amount: expense.goal_amount ? parseFloat(expense.goal_amount).toFixed(2) : '',
                            has_goal_amount: expense.has_goal_amount ? expense.has_goal_amount : '',
                            earlier_amount_paid: total_deductions.status ? parseFloat(total_deductions.data).toFixed(2) : 0.00,
                            amount_paid: expense.due_amount > expense.amount ? parseFloat(expense.amount).toFixed(2) : parseFloat(expense.due_amount).toFixed(2),
                            reference_id: expense.reference_id,
                            credit: true
                        }
                        creditExpenses.push(credit_expense_object)
                        expense_due += expense.due_amount
                    }
                    if (expense_due == 0) {
                        expense_available = false;
                        expense_due = 0;
                        creditExpenses = [];
                    }
                }

                /**
                 * Deduct expenses from the payroll
                 */
                if (debitExpensesManagement.status) {
                    expense_available = true;
                    for (let keys in debitExpensesManagement.data) {
                        let expense = debitExpensesManagement.data[keys]
                        var total_deductions = await indexRepository.sum('expense_transaction_track', { expense_id: expense.id }, 'amount')
                        debit_expense_object = {
                            id: expense.id,
                            employee_id: expense.employee_id,
                            expense_type_id: expense.expense_type_id,
                            expense_type: expense.expense_type,
                            expense_transaction_type: expense.expense_transaction_type,
                            expense_effect_on: expense.expense_effect_on,
                            amount: parseFloat(expense.amount).toFixed(2),
                            due_amount: parseFloat(expense.due_amount).toFixed(2),
                            goal_amount: expense.goal_amount ? parseFloat(expense.goal_amount).toFixed(2) : '',
                            has_goal_amount: expense.has_goal_amount ? expense.has_goal_amount : '',
                            earlier_amount_paid: total_deductions.status ? parseFloat(total_deductions.data).toFixed(2) : 0.00,
                            amount_paid: expense.due_amount > expense.amount ? parseFloat(expense.amount).toFixed(2) : parseFloat(expense.due_amount).toFixed(2),
                            reference_id: expense.reference_id,
                            credit: false
                        }
                        debitExpenses.push(debit_expense_object)
                        expense_due -= expense.due_amount
                    }
                    if (expense_due == 0) {
                        expense_available = false;
                        expense_due = 0;
                        debitExpenses = [];
                    }
                }
            }

            /**
             * Deduct expense amount through payroll
             */
            let placement_is_going_end = false;
            let placement_ended = false;

            if (placements_info.data.length > 0) {
                for (let keys in placements_info.data) {
                    let placementWisePayInfo = placements_info.data[keys];
                    // If the placement is going to end in 1 month, then push the data to placement ending object
                    if (placementWisePayInfo.placement_end_date) {
                        if (moment(item.to_date).format('YYYY/MM/DD') > moment(placementWisePayInfo.placement_end_date).format('YYYY/MM/DD')) {
                            placement_ended = true;
                            placement_is_going_end = false;
                        } else {
                            placement_ended = false;
                            placement_is_going_end = true;
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            let debitexpense_total_amount = debitexpense.status ? debitexpense.data : 0.00;
            let reimbusment_total_amount = creditexpense.status ? creditexpense.data : 0.00;
            let total_amt = item.total_amount ? parseFloat(item.total_amount) : 0.00;
            let hoursCondition = { id: item.employee_id, from: moment(item.from_date).format('YYYY-MM-DD'), to: moment(item.to_date).format('YYYY-MM-DD') }
            let invoiceRaised = await getInvoiceStatusForPayrollHours(hoursCondition);

            let placementInformation = await payrollPlacementInfo({ 'payroll.payroll_configuration_id': item.payroll_configuration_id, 'payroll.employee_id': item.employee_id }, 0, 1);

            /**
             * Based on the visa status we are defining the amount payout
             */
            let autoCalculatedAmountPaid = 0;
            if(item.amount_paid != null) {
                autoCalculatedAmountPaid = item.amount_paid;
            } else {
                if (item.visa_type_name == 'H1B' || item.visa_type_name == 'H-1B') {
                    if (item.standard_pay_amount == null || item.standard_pay_amount == 0) {
                        autoCalculatedAmountPaid = total_amt;
                    } else {
                        autoCalculatedAmountPaid = (placementInformation.data.length) > 0 ? (placementInformation.data.length) * item.standard_pay_amount : total_amt;
                    }
                } else {
                    if (item.standard_pay_amount == null || item.standard_pay_amount == 0) {
                        autoCalculatedAmountPaid = total_amt;
                    } else {
                        autoCalculatedAmountPaid = (placementInformation.data.length) > 0 ? item.standard_pay_amount : total_amt;
                    }
                }
            } 

            let placements_exists_information = [];
            let timesheet_approval_pending = false;
            if (placementInformation.status) {
                placementInformation.data.forEach(element => {
                    if (element) {
                        if(element.timesheet_approval_pending == true){
                            timesheet_approval_pending = true
                        }
                        placements_exists_information.push(element)
                    }
                });
            }

            //Calculate the current balance information
            let availableBalanceAtThisPay = 0;
            if (item.payroll_status == 'Submitted') {
                availableBalanceAtThisPay = item.balance_amount;
            } else {
                if (item.current_available_balance) {
                    availableBalanceAtThisPay = item.current_available_balance + (total_amt - autoCalculatedAmountPaid);
                } else {
                    availableBalanceAtThisPay = (total_amt - autoCalculatedAmountPaid);
                }
            }

            let currentArrayObject;
            if (item.employment_type_id == 1) {
                currentArrayObject = 3; // Internal Employees
            } else if (placement_ended) {
                currentArrayObject = 4; //Project Completed
            } else if (placement_is_going_end) {
                currentArrayObject = 5; //Placement Going To End
            } else if (item.status == 'In Active') {
                currentArrayObject = 6; // Inactive Employees
            } else if (item.employee_categorie_name == 'W2') {
                currentArrayObject = 1; // W2 Employee
            } else if (item.employee_categorie_name == '1099') {
                currentArrayObject = 2; // 1099 Employee
            } else {
                currentArrayObject = 7; // Other    
            }

            listingObject = {
                id: item.id,
                payroll_configuration_id: item.payroll_configuration_id,
                timesheet_approval_pending: timesheet_approval_pending,
                status: item.payroll_status ? item.payroll_status : false,
                is_finalize: item.is_finalize ? item.is_finalize : false,
                employee_name: item.employee_name,
                employee_id: item.employee_id,
                employee_reference_id: item.employee_reference_id,
                profile_picture_url: item.profile_picture_url ? item.profile_picture_url : generateEmployeeAvatar(item),
                visa_type_name: item.visa_type_name ? item.visa_type_name : '-',
                total_amount: parseFloat(total_amt).toFixed(2),
                comments: item.comments ? item.comments : '',
                worked_hours: item.worked_hours,
                invoice_color: invoiceRaised.status ? color.invoiced : color.invoiced_pending,
                invoice_status: invoiceRaised.status,
                amount_paid: parseFloat(autoCalculatedAmountPaid).toFixed(2),
                net_amount: parseFloat((autoCalculatedAmountPaid + reimbusment_total_amount) - (debitexpense_total_amount)).toFixed(2),
                debit_expense_available: debitexpense.status ? parseFloat(debitexpense.data).toFixed(2) : 0.00,
                credit_expense_available: creditexpense.status ? parseFloat(creditexpense.data).toFixed(2) : 0.00,
                period: payrollPeriod,
                balance_amount: item.balance_amount ? parseFloat(item.balance_amount).toFixed(2) : 0.00,
                available_balance_amount: Number(parseFloat(availableBalanceAtThisPay).toFixed(2)),
                placement_count: placementCount ? Number(placementCount.count) : 0.00,
                expense_due: expense_due,
                is_expense_available: expense_available,
                credit_expenses_data: creditExpenses,
                debit_expenses_data: debitExpenses,
                placement_information: placements_exists_information,
                mapped_object: currentArrayObject,
            }


            if (item.status == 'In Active') { // Inactive employees
                leftSno = leftSno + 1;
                listingObject.sno = leftSno;
                leftEmployeeData.push(listingObject);
            }
            else if (placement_ended) { // Placement Ended Employees
                placementEndedSno = placementEndedSno + 1;
                listingObject.sno = placementEndedSno;
                PlacementCompleted.push(listingObject);
            } else if (placement_is_going_end) { // Placement is going to end
                placementGoingToEndSno = placementGoingToEndSno + 1;
                listingObject.sno = placementGoingToEndSno;
                PlacementGoingToComplete.push(listingObject);
            } else if (item.employment_type_id == 1) { // Internal Employee
                internalSno = internalSno + 1;
                listingObject.sno = internalSno;
                internalEmployee.push(listingObject);
            }
            // else if (item.employment_type_id == 3) { // Contractors
            //     contractorSno = contractorSno + 1
            //     listingObject.sno = contractorSno;
            //     contractorEmployee.push(listingObject);
            // } 
            else if (item.employee_categorie_name == 'W2') { // Consultant W2 Employee
                w2Sno = w2Sno + 1;
                listingObject.sno = w2Sno;
                w2Employee.push(listingObject);
            } else if (item.employee_categorie_name == '1099') { // Consultant 1099 Employee
                onezero99Sno = onezero99Sno + 1;
                listingObject.sno = onezero99Sno;
                onezero99.push(listingObject);
            } else {  // Other employee
                otherSno = otherSno + 1;
                listingObject.sno = otherSno;
                other.push(listingObject);
            }

            // Segrate Finalized & Not Finalized employees
            if (item?.is_finalize) {
                finalizeSno += 1;
                listingObject.sno = finalizeSno;
                finalizedEmployees.push(listingObject)
            } else {
                unFinalizedSno += 1;
                listingObject.sno = unFinalizedSno;
                unFinalizedEmployees.push(listingObject)
            }
        }

        let tempResponse = {
            'w2': w2Employee,
            '1099': onezero99,
            'internal_employees': internalEmployee,
            'project_completed': PlacementCompleted,
            'placement_going_to_end': PlacementGoingToComplete,
            'in_active_employee': leftEmployeeData,
            'finalized_employees': finalizedEmployees,
            'unFinalized_employees': unFinalizedEmployees,
            'others': other
        }
        responseData.push(tempResponse);

        return { status: true, data: responseData, pagination_data: pagination_details, payrollPeriod, ot_hours_exists: othoursExistsInPayroll, enable_submit: true };
    } else {
        return payrollData;
    }
}

/**
 * Handles the process of marking payroll as submitted and updating related data.
 *
 * @param {object} body - The request body containing payroll configuration details.
 * @returns {object} - The result of updating payroll configuration.
 *
 * Logic:
 * - Update the status of the payroll configuration to 'submitted'.
 * - Retrieve the 'from_date' and 'to_date' from the payroll configuration.
 * - Construct a raw SQL query to update related timesheet hours data.
 * - Execute the raw SQL query to mark timesheet hours as 'payroll_raised'.
 * - Return the result of updating the payroll configuration.
 */
const payrollRun = async (body) => {
    // Mark Payroll as submitted
    let updateData = {
        status: 'Submitted', // is submitted
        updated_at: new Date(),
        updated_by: body.updated_by
    }
    var payrollData = await indexRepository.update('payroll_configuration', { id: body.payroll_configuration_id }, updateData)

    let tempData = await indexRepository.find('payroll_configuration', ['from_date', 'to_date'], { id: body.payroll_configuration_id }, null, [], null, null, null, false);
    let fromData = tempData.data[0].from_date;
    let toData = tempData.data[0].to_date;

    /* Update the all timesheet hours that exists between this date to payroll_raised */
    let rawQuery = `UPDATE timesheet_hours
    SET payroll_raised = true
    FROM timesheets
    JOIN placements ON placements.id = timesheets.placement_id
    JOIN employee AS emp ON emp.id = placements.employee_id
    JOIN payroll_config_settings AS pcs ON pcs.id = emp.payroll_config_settings_id
    JOIN payroll_configuration AS pc ON pc.pay_config_setting_id = pcs.id
    WHERE timesheet_hours.timesheet_id = timesheets.id
    and timesheet_hours.date >= '${moment(fromData).format('YYYY-MM-DD')}' and timesheet_hours.date <= '${moment(toData).format('YYYY-MM-DD')}' and pc.id = '${body.payroll_configuration_id}'`;
    /* Update the all timesheet hours that exists between this date to payroll_raised */

    await indexRepository.rawQuery(rawQuery);

    return payrollData;
}

/**
 * Handles payroll payment updates based on the provided request.
 *
 * @param {object} req - The request object containing payroll payment details for multiple employees.
 * @param {object} res - The response object to be sent back.
 *
 * Logic:
 * - Log the incoming request for payroll payment update.
 * - Initialize a variable 'responseData'.
 * - Define validation rules for the input request.
 * - Run the defined validation rules against the request.
 * - If there are validation errors:
 *   - Throw an InvalidRequestError with an unprocessable entity code, providing the first error message encountered.
 * - If validation is successful:
 *   - Call the submit payroll service function using the data from the request body.
 *   - Construct a success response indicating successful payment update.
 *   - Log the response.
 *   - Send the constructed response using the responseHandler.
 */
const submitPayroll = async (body) => {
    let response = [];
    for (let key in body.employees) {
        let item = body.employees[key]; // Assign to a varibale

        var payroll_date = null;
        if (payroll_date == null) {
            /* Fetching the Payroll Generate Dates Information */
            let payrollData = await indexRepository.find('payroll_configuration', ['to_date'], { id: item.payroll_configuration_id }, null, [], null, null, null, false);
            payroll_date = moment(payrollData.data[0].to_date).format('YYYY-MM-DD')
        }
        /* Fetching the Payroll Generate Dates Information */

        // Fetch the current payroll_payment_details
        let payrollPaymentcondition = { 'employee_id': item.employee_id, 'payroll_configuration_id': item.payroll_configuration_id };

        // Credit expenses condition
        let creditCondition = {
            'employee_id': item.employee_id,
            'expense_effect_on': 1, // payroll effect expense
            "expense_transaction_type": 1,  //Reumbesmet falg
            'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and "enable_approval" = false or("enable_approval" = true and "otp_verified" = true) and "raised_date" <= '${payroll_date}'`
        };

        // Debit expense condition
        let debitCondition = {
            'employee_id': item.employee_id,
            'expense_effect_on': 1, // payroll effect expense
            "expense_transaction_type": 2, //Reumbesmet falg
            'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and "enable_approval" = false or("enable_approval" = true and "otp_verified" = true) and "raised_date" <= '${payroll_date}'`
        }

        var payrollData = await indexRepository.sum('payroll_payment_details', payrollPaymentcondition, 'total_amount', [], false);
        total_amount_payable = payrollData.data

        // Fetch the expenses details
        let creditexpense = await indexRepository.sum('expense_management', creditCondition, 'due_amount'); // Total reimbusment amount
        let reimbusment_total_amount = creditexpense.status ? creditexpense.data : 0;

        let debitexpense = await indexRepository.sum('expense_management', debitCondition, 'due_amount') // Current payroll due amount
        let debitexpense_total_amount = debitexpense.status ? debitexpense.data : 0;

        let balance_amount = parseFloat((parseFloat(total_amount_payable) + parseFloat(reimbusment_total_amount)) - (parseFloat(item.amount_paid) + parseFloat(debitexpense_total_amount))).toFixed(2);

        /**
         * Fetch Payroll employee information
         */
        let payrollEmployeeData = await indexRepository.find('employee', ['balance_amount', 'hours_worked', 'employment_type_id'], { id: item.employee_id }); // Employee Information

        if (payrollEmployeeData.data[0].employment_type_id == 1) {
            balance_amount = 0
        }

        if (item.is_draft == true) {
            let updateAmount = {
                amount_paid: item.amount_paid,
                is_finalize: item.is_finalize,
                balance_amount: balance_amount,
                credited_expense: reimbusment_total_amount,
                debited_expense: debitexpense_total_amount,
                updated_by: body.updated_by,
                comments: item.comments ? item.comments : null,
                updated_at: new Date()
            };
            await indexRepository.update('payroll_payment_details', payrollPaymentcondition, updateAmount)
        } else {

            /**
             * Join tables to fetch the expense information
             */
            const fields = ['expense_management.*', 'emt.name as expense_type']
            const joins = [
                { table: 'expense_and_service_types as emt', alias: 'emt', condition: ['expense_management.expense_type_id', 'emt.id'] }
            ]

            /**
             * Fetch all credit expenses
             */
            let creditExpensesManagement = await indexRepository.find('expense_management', fields, creditCondition, null, joins);

            /**
             * Fetch all debit expenses
             */
            let debitExpensesManagement = await indexRepository.find('expense_management', fields, debitCondition, null, joins);

            /**
             * Credit Expenses Reimbusment through payroll
             */
            if (creditExpensesManagement.status) {
                for (let keys in creditExpensesManagement.data) {
                    let expense = creditExpensesManagement.data[keys];
                    let is_recurring = expense.is_recurring;
                    let updateCreditExpenses;

                    if (is_recurring) {
                        let recurring_count = expense.recurring_count ? expense.recurring_count : 0;
                        if (recurring_count > 0) {
                            var status;
                            if(recurring_count - 1 == 0) {
                                status = 'Processed'
                            } else {
                                status = 'Reimbursement In Progress'
                            }
                            updateCreditExpenses = {
                                recurring_count: recurring_count - 1,
                                status: status
                            }
                            await indexRepository.update('expense_management', { id: expense.id }, updateCreditExpenses);
                        }
                    } else {
                        updateCreditExpenses = {
                            due_amount: 0,
                            status: 'Processed'
                        }
                        await indexRepository.update('expense_management', { id: expense.id }, updateCreditExpenses);
                    }

                    /**
                     * Store the deduction expenses
                     */
                    var deductionObject = {
                        expense_id: expense.id,
                        amount: reimbusment_total_amount,
                        payroll_configuration_id: item.payroll_configuration_id,
                        transaction_date: moment().format('YYYY-MM-DD'),
                        created_at: new Date(),
                        created_by: body.created_by
                    }
                    await indexRepository.store('expense_transaction_track', deductionObject); // Store the deduction information
                }
            }

            /**
             * Deduct expenses from the payroll.
             * Update the deduction due amount and amount paid based on conditions
             */
            if (debitExpensesManagement.status) {
                for (let keys in debitExpensesManagement.data) {
                    let expense = debitExpensesManagement.data[keys];

                    var total_previous_deductions = await indexRepository.sum('expense_transaction_track', { expense_id: expense.id }, 'amount'); // Fetch the previous deduction amount

                    let due_amount = expense.due_amount;
                    let earlier_amount_paid = total_previous_deductions.status ? total_previous_deductions.data : 0;

                    let updateDebitExpenses;
                    /**
                     * Update the expenses based on goal condition
                     */
                    let updated_due_amount;
                    if (expense.has_goal_amount) {
                        let goal_amount = expense.goal_amount;
                        let temp_due_amount = (goal_amount) - (earlier_amount_paid + due_amount);
                        //Set the goal amount based on the due amount
                        if (temp_due_amount > due_amount) {
                            updated_due_amount = due_amount
                        } else {
                            updated_due_amount = temp_due_amount
                        }
                        updateDebitExpenses = {
                            due_amount: updated_due_amount,
                            status: updated_due_amount == 0 ? 'Processed' : 'Deduction In Progress',
                        }
                    } else {
                        updateDebitExpenses = {
                            due_amount: due_amount,
                            status: updated_due_amount == 0 ? 'Processed' : 'Deduction In Progress',
                        }
                    }
                    await indexRepository.update('expense_management', { id: expense.id }, updateDebitExpenses)

                    /**
                     * Store the deduction expenses
                     */
                    var deductionObject = {
                        expense_id: expense.id,
                        amount: due_amount,
                        payroll_configuration_id: item.payroll_configuration_id,
                        transaction_date: moment().format('YYYY-MM-DD'),
                        created_at: new Date(),
                        created_by: body.created_by
                    }
                    await indexRepository.store('expense_transaction_track', deductionObject); // Store the deduction information
                }
            }

            let updateAmount = {
                amount_paid: item.amount_paid,
                is_finalize: item.is_finalize,
                balance_amount: balance_amount,
                credited_expense: reimbusment_total_amount,
                debited_expense: debitexpense_total_amount,
                updated_by: body.updated_by,
                comments: item.comments ? item.comments : null,
                updated_at: new Date()
            };
            await indexRepository.update('payroll_payment_details', payrollPaymentcondition, updateAmount);

            let hoursWorkedOnPayperiod = await indexRepository.find('payroll_payment_details', ['worked_hours'], payrollPaymentcondition, 1, [], null, null, null, true); // Fetch Payroll payment details

            let updatedHoursWorked = payrollEmployeeData.data[0].hours_worked + hoursWorkedOnPayperiod.data[0].worked_hours;
            let empLatestBalance = payrollEmployeeData.data[0].balance_amount + parseFloat(balance_amount);

            await indexRepository.update('employee', { id: item.employee_id }, { balance_amount: empLatestBalance, hours_worked: updatedHoursWorked });
        }
    }
    return response;
}

const payrollPaymentInfo = async (condition, page, limit) => {
    let othoursExistsInPayroll = false;

    const fields = ['payroll_payment_details.*', 'pc.from_date', 'pc.status', 'pc.to_date', 'emp.display_name as employee_name', 'emp.balance_amount as available_balance', 'emp.standard_pay_amount', 'emp.id as employee_id', 'employee_categories.name as employee_categorie_name', 'emp.status', 'emp.sub_status', 'emp.employment_type_id', 'visa_types.name as visa_type_name',]
    const joins = [
        { table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'payroll_payment_details.employee_id'] },
        { table: 'visa_types', alias: 'visa_types', condition: ['emp.visa_type_id', 'visa_types.id'], type: 'left' },
        { table: 'employee_categories', alias: '', condition: ['emp.employee_category_id', 'employee_categories.id'] },
        { table: 'payroll_configuration as pc', alias: 'pc', condition: ['pc.id', 'payroll_payment_details.payroll_configuration_id'] },
    ]
    var payrollData = await indexRepository.findByPagination('payroll_payment_details', fields, condition, joins, 1, 0, null, null, false)

    if (payrollData.status) {
        /* Variables */
        var listingObject = [];
        let responseData = [];
        let leftEmployeeData = [];
        let PlacementGoingToComplete = [];
        let PlacementCompleted = [];
        let internalEmployee = [];
        let w2Employee = [];
        let onezero99 = [];
        let contractorEmployee = [];
        let other = [];
        let payrollPeriod;
        let dateFormat = await format.getDateFormat();

        let placementEndedSno = 0;
        let placementGoingToEndSno = 0;
        let leftSno = 0;
        let internalSno = 0;
        let contractorSno = 0;
        let w2Sno = 0;
        let onezero99Sno = 0;
        let otherSno = 0;
        var total_details = payrollData.data;
        var pagination_details = payrollData.pagination;
        /* Variables */

        /* Prepare the response */
        serial_no = (page - 1) * limit + 1;
        for (let key in total_details) {
            var item = total_details[key];

            payrollPeriod = moment(item.from_date).format(dateFormat) + ' - ' + moment(item.to_date).format(dateFormat);

            /**
             * Retrieves the payroll information for a specific employee and payroll configuration.
             * , active_projects: moment(item.from_date).format("YYYY-MM-DD")
             */
            let placements_info = await payRollRepository.listingFind({ employee_id: item.employee_id, pay_roll_configuration_id: item.payroll_configuration_id });

            /**
             * Retrieves the count of placements for a given employee and payroll configuration.
             * @param {object} item - The item containing the employee_id and payroll_configuration_id.
             * @returns {Promise<number>} - A promise that resolves to the count of placements.
             */
            let placementCount = await payRollRepository.countPlacements({ 'pr.employee_id': item.employee_id, 'pr.payroll_configuration_id': item.payroll_configuration_id })

            /**
             * Bifurcating using placement end date
             */
            let placement_is_going_end = false;
            let placement_ended = false;
            if (placements_info.data.length > 0) {
                for (let keys in placements_info.data) {
                    let placementWisePayInfo = placements_info.data[keys];
                    // If the placement is going to end in 1 month, then push the data to placement ending object
                    if (placementWisePayInfo.placement_end_date) {
                        if (moment(item.to_date).format('YYYY/MM/DD') > moment(placementWisePayInfo.placement_end_date).format('YYYY/MM/DD')) {
                            placement_ended = true;
                            placement_is_going_end = false;
                        } else {
                            placement_ended = false;
                            placement_is_going_end = true;
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            let reimbusment_total_amount = item.credited_expense;
            let debitexpense_total_amount = item.debited_expense;
            let paid_amt = item.amount_paid;
            let total_amt = item.total_amount;

            let placementInformation = await payrollPlacementInfo({ 'payroll.payroll_configuration_id': item.payroll_configuration_id, 'payroll.employee_id': item.employee_id }, 0, 1);

            listingObject = {
                id: item.id,
                payroll_configuration_id: item.payroll_configuration_id,
                employee_name: item.employee_name,
                employee_id: item.employee_id,
                total_amount: item.total_amount,
                worked_hours: item.worked_hours,
                visa_type_name: item.visa_type_name ? item.visa_type_name : '-',
                credited_expense: item.credited_expense,
                debited_expense: item.debited_expense,
                amount_paid: item.amount_paid,
                balance_amount: item.balance_amount,
                comments: item.comments ? item.comments : '',
                placement_count: placementCount ? Number(placementCount.count) : 0,
                available_balance: item.available_balance,
                net_amount: (paid_amt + reimbusment_total_amount) - (debitexpense_total_amount),
                placement_information: !placement_ended ? (placementInformation.status ? placementInformation.data : []) : []
            }

            if (item.status == 'In Active') { // Inactive employees
                leftSno = leftSno + 1;
                listingObject.sno = leftSno;
                leftEmployeeData.push(listingObject);
            }
            else if (placement_ended) { // Placement Ended Employees
                placementEndedSno = placementEndedSno + 1;
                listingObject.sno = placementEndedSno;
                PlacementCompleted.push(listingObject);
            } else if (placement_is_going_end) { // Placement is going to end
                placementGoingToEndSno = placementGoingToEndSno + 1;
                listingObject.sno = placementGoingToEndSno;
                PlacementGoingToComplete.push(listingObject);
            } else if (item.employment_type_id == 1) { // Internal Employee
                internalSno = internalSno + 1;
                listingObject.sno = internalSno;
                internalEmployee.push(listingObject);
            }
            // else if (item.employment_type_id == 3) { // Contractors
            //     contractorSno = contractorSno + 1
            //     listingObject.sno = contractorSno;
            //     contractorEmployee.push(listingObject);
            // } 
            else if (item.employee_categorie_name == 'W2') { // Consultant W2 Employee
                w2Sno = w2Sno + 1;
                listingObject.sno = w2Sno;
                w2Employee.push(listingObject);
            } else if (item.employee_categorie_name == '1099') { // Consultant 1099 Employee
                onezero99Sno = onezero99Sno + 1;
                listingObject.sno = onezero99Sno;
                onezero99.push(listingObject);
            } else {  // Other employee
                otherSno = otherSno + 1;
                listingObject.sno = otherSno;
                other.push(listingObject);
            }
        }

        let tempResponse = {
            'w2': w2Employee,
            '1099': onezero99,
            'internal_employees': internalEmployee,
            'project_completed': PlacementCompleted,
            'placement_going_to_end': PlacementGoingToComplete,
            'in_active_employee': leftEmployeeData,
            'others': other
        }
        responseData.push(tempResponse);
        return { status: true, data: responseData, pagination_data: pagination_details, payrollPeriod, ot_hours_exists: othoursExistsInPayroll };
    } else {
        return payrollData;
    }
};

const payrollPaymentInfo1 = async (condition, page, limit) => {
    let query = `SELECT * FROM GetPayRollPaymentInfo(`;
    query += (condition.pay_roll_configuration_id !== null) ? `'${condition.pay_roll_configuration_id}', ` : `${condition.pay_roll_configuration_id}, `;
    query += (condition.visa_type_id !== null) ? `'${condition.visa_type_id}', ` : `${condition.visa_type_id}, `;
    query += (condition.status !== null) ? `'${condition.status}', ` : `${condition.status}, `;
    query += `'${condition.search}', ${limit}, ${page})`;

    // Get employees Lisitng using stored
    const payRollPaymentInfo = await indexRepository.rawQuery(query);

    if (payRollPaymentInfo) {

    }
};

/**
 * Retrieves balance sheet index data based on the provided conditions:
 * - Accepts a request object (`req`) and additional conditions.
 * - Constructs SQL queries to calculate various financial metrics.
 * - Executes the queries using `indexRepository.rawQuery` to fetch relevant data.
 * - Constructs a response object based on the fetched data, including common data and financial summary specifics.
 * - Handles payroll and expense summaries separately.
 * - Returns a response object containing the status and data.
 *
 * @param {object} req - Request object containing parameters like employee_id, financial_summary, display_name, etc.
 * @param {object} condition - Additional conditions for filtering data (e.g., from_date, to_date).
 * @returns {object} - An object with 'status' indicating success or failure and 'data' containing the retrieved balance sheet index data.
 */
const balanceSheetIndexCard = async (req, condition) => {

    let response = {};

    const employeeId = req.employee_id;
    const financialSummary = req.financial_summary;

    // let total_billed_hours;
    let total_billed_amount;
    let total_paid_amount;
    let total_balance_amount;
    let total_expense_amount;
    let total_worked_hours;
    let total_earned_amount;
    let query = "SELECT";

    // const joins1 = " INNER JOIN ledgers ON ledger_item_details.ledger_id = ledgers.id"
    const join2 = " JOIN payroll_configuration AS pc ON pc.id = ppd.payroll_configuration_id"

    // const totalBilledHours = `${ query } SUM(ledger_item_details.hours) FROM ledger_item_details ${ joins1 }  where "employee_id" = '${employeeId}' AND ledgers.approved_status = 3 AND ledger_item_details.deleted_at IS NULL`;
    const totalBilledAmount = `${query} SUM(ppd.total_amount) FROM payroll_payment_details as ppd ${join2}  where "employee_id" = '${employeeId}' AND pc.status = 'Submitted' AND ppd.deleted_at IS NULL`;
    const totalPaidAmount = `${query} SUM(ppd.amount_paid) FROM payroll_payment_details as ppd ${join2}  where ppd.employee_id = '${employeeId}' AND pc.status = 'Submitted' AND ppd.deleted_at IS NULL`;
    const totalBalanceAmount = `${query} SUM(ppd.balance_amount) FROM payroll_payment_details as ppd  ${join2}  where ppd.employee_id = '${employeeId}' AND pc.status = 'Submitted' AND ppd.deleted_at IS NULL`;
    const totalHoursWorked = `${query} SUM(ppd.worked_hours) FROM payroll_payment_details as ppd  ${join2}  where ppd.employee_id = '${employeeId}' AND pc.status = 'Submitted' AND ppd.deleted_at IS NULL`;
    const totalAmountEarned = `${query} SUM(ppd.total_amount) FROM payroll_payment_details as ppd  ${join2}  where ppd.employee_id = '${employeeId}' AND pc.status = 'Submitted' AND ppd.deleted_at IS NULL`;
    const totalExpenses = `${query} SUM(amount) from expense_management WHERE deleted_at IS NULL AND "employee_id" = '${employeeId}'`;

    let whereClause = " ";

    // total_billed_hours = await indexRepository.rawQuery(`${ totalBilledHours } ${ whereClause } `);
    total_billed_amount = await indexRepository.rawQuery(`${totalBilledAmount} ${whereClause} `);
    total_paid_amount = await indexRepository.rawQuery(`${totalPaidAmount} ${whereClause} `);
    total_balance_amount = await indexRepository.rawQuery(`${totalBalanceAmount} ${whereClause} `);
    total_worked_hours = await indexRepository.rawQuery(`${totalHoursWorked} ${whereClause} `);
    total_earned_amount = await indexRepository.rawQuery(`${totalAmountEarned} ${whereClause} `);
    // total_expense = await indexRepository.rawQuery(`${ totalExpenses } ${ whereClause } `);

    var commonData = {
        employee_name: req.display_name,
        reference_id: req.reference_id,
        balance_amount: req.balance_amount,
        avatar: (req?.profile_picture_url) ? req?.profile_picture_url : generateEmployeeAvatar(req),
        total_worked_hours: total_worked_hours?.[0].sum || 0,
        total_billed_amount: total_billed_amount?.[0].sum ? parseFloat(total_billed_amount?.[0].sum).toFixed(2) : 0,
        total_balance_amount: total_balance_amount?.[0].sum ? parseFloat(total_balance_amount?.[0].sum).toFixed(2) : 0,
    }

    if (financialSummary == 'payroll_summary') {
        response = {
            status: true,
            data: {
                ...commonData,
                total_paid_amount: total_paid_amount?.[0].sum ? parseFloat(total_paid_amount?.[0].sum).toFixed(2) : 0
            }
        }
    }
    else if (financialSummary === 'expense_summary') {
        if (req?.expense_transaction_type && condition.from_date && condition.to_date) {
            whereClause += ` AND expense_transaction_type = ${req.expense_transaction_type} AND raised_date BETWEEN '${condition.from_date}' AND '${condition.to_date}' AND status IN ('Processed', 'Reimbursement In Progress', 'Deduction In Progress')`;
            total_expense_amount = await indexRepository.rawQuery(`${totalExpenses} ${whereClause} `);
        } else if (req?.expense_transaction_type) {
            whereClause += ` AND expense_transaction_type = ${req.expense_transaction_type} AND status IN ('Processed', 'Reimbursement In Progress', 'Deduction In Progress') `;
            total_expense_amount = await indexRepository.rawQuery(`${totalExpenses} ${whereClause} `);
        }
        response = {
            status: true,
            data: {
                ...commonData,
                total_expense_amount: total_expense_amount?.[0]?.sum ? parseFloat(total_expense_amount?.[0]?.sum).toFixed(2) : 0,
            }
        };
    } else {
        response = { status: false, error: error.message }
    }
    return response;

};

const index = async (condition, page, limit) => {
    let othoursExistsInPayroll = false;
    let dateFormat = await format.getDateFormat();

    /**
     * Fetching the payment details
     */
    const fields = ['payroll_payment_details.*', 'visa_types.name as visa_name', 'pc.from_date', 'pc.status as payroll_status', 'pc.to_date', 'pc.check_date', 'emp.display_name as employee_name', 'emp.standard_pay_amount', 'emp.id as employee_id', 'employee_categories.name as employee_categorie_name', 'emp.status', 'emp.sub_status', 'emp.employment_type_id'];
    const payrollJoins = [
        { table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'payroll_payment_details.employee_id'] },
        { table: 'visa_types', alias: 'visa_types', condition: ['emp.visa_type_id', 'visa_types.id'], type: 'left' },
        { table: 'employee_categories', alias: '', condition: ['emp.employee_category_id', 'employee_categories.id'] },
        { table: 'payroll_configuration as pc', alias: 'pc', condition: ['pc.id', 'payroll_payment_details.payroll_configuration_id'], ignoreDeletedAt: true },
    ]
    var payrollData = await indexRepository.findByPagination('payroll_payment_details', fields, condition, payrollJoins, page, limit);

    /* Variables */
    var finallistingObject = [];
    var final_pagination_data = payrollData.pagination;
    /* Variables */

    if (payrollData.status) {
        /* Variables */
        var total_details = payrollData.data;
        /* Variables */

        /* Prepare the response */
        serial_no = (page - 1) * limit + 1;
        for (let key in total_details) {
            var item = total_details[key];

            payrollPeriod = moment(item.from_date).format(dateFormat) + ' - ' + moment(item.to_date).format(dateFormat);

            /**
             * Retrieves the count of placements for a given employee and payroll configuration.
             * @param {object} item - The item containing the employee_id and payroll_configuration_id.
             * @returns {Promise<number>} - A promise that resolves to the count of placements.
             */
            let placementCount = await payRollRepository.countPlacements({ 'pr.employee_id': item.employee_id, 'pr.payroll_configuration_id': item.payroll_configuration_id })

            // let reimbusment_total_amount = item.credited_expense;
            // let debitexpense_total_amount = item.debited_expense;
            let paid_amt = item.amount_paid;
            let total_amt = item.total_amount;

            let placementInformation = await payrollPlacementInfo({ 'payroll.payroll_configuration_id': item.payroll_configuration_id, 'payroll.employee_id': item.employee_id }, 0, 1);

            let creditexpense = {status: false}
            let debitexpense = {status: false}
            
            if(item.payroll_status == 'Submitted') {
                const fields = ['expense_transaction_track.*', 'em.expense_transaction_type']
                const joins = [
                    { table: 'expense_management as em', alias: 'em', condition: ['expense_transaction_track.expense_id', 'em.id'] }
                ]
                /**
                 * Fetch all expenses
                 */
                let expenseCondition = {
                    'expense_transaction_track.payroll_configuration_id': item.payroll_configuration_id,
                }
                let allExpensesManagement = await indexRepository.find('expense_transaction_track', fields, expenseCondition, null, joins);

                if(allExpensesManagement.status){
                    let totalExpensesData = allExpensesManagement.data
                    for(const expense of totalExpensesData) {
                        expense_available = true;
                        if(expense.expense_transaction_type == 1) {
                            creditexpense.status = true
                            creditexpense.data = expense.amount
                        } else {
                            debitexpense.status = true
                            debitexpense.data = expense.amount
                        }
                    }
                }
            } else {
                let payrollEndDate = moment(item.to_date).format("YYYY-MM-DD");
                /**
                 * Fetch all credit expenses
                 */
                let creditCondition = {
                    'employee_id': item.employee_id,
                    'expense_effect_on': 1, // payroll effect expense 
                    "expense_transaction_type": 1,  //Reumbesmet falg
                    'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and "raised_date" <= '${payrollEndDate}'`
                }

                /**
                 * Fetch all debit expenses
                 */
                let debitCondition = {
                    'employee_id': item.employee_id,
                    'expense_effect_on': 1, // payroll effect expense 64a42fd2-db64-4a6f-9cf8-bb9ca03d4edd
                    "expense_transaction_type": 2, //Deduction falg
                    'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and  "raised_date" <= '${payrollEndDate}'`
                }

                creditexpense = await indexRepository.sum('expense_management', creditCondition, 'due_amount')
                debitexpense = await indexRepository.sum('expense_management', debitCondition, 'due_amount')

            }
            let reimbusment_total_amount = creditexpense.status ? parseFloat(creditexpense.data).toFixed(2) : 0.00;
            let debitexpense_total_amount = debitexpense.status ? parseFloat(debitexpense.data).toFixed(2) : 0.00;
            listingObject = {
                id: item.id,
                payroll_configuration_id: item.payroll_configuration_id,
                timesheet_approval_pending: false,
                status: item.status,
                employee_name: item.employee_name,
                visa_name: item.visa_name,
                employee_id: item.employee_id,
                total_amount: total_amt,
                worked_hours: item.worked_hours,
                amount_paid: item.amount_paid == 0 ? item.standard_pay_amount : item.amount_paid,
                net_amount: (parseFloat(paid_amt) + parseFloat(reimbusment_total_amount)) - (parseFloat(debitexpense_total_amount)),
                period: moment(item.from_date).format(dateFormat) + ' - ' + moment(item.to_date).format(dateFormat),
                pay_date: moment(item.check_date).format(dateFormat),
                balance_amount: item.balance_amount ? parseFloat(item.balance_amount).toFixed(2) : 0,
                placement_count: placementCount ? Number(placementCount.count) : 0,
                reimbursement: reimbusment_total_amount,
                deduction: debitexpense_total_amount,
                comments: item.comments,
                placement_information: placementInformation.data
            }

            finallistingObject.push(listingObject);
        }
        return { status: true, data: finallistingObject, pagination_data: final_pagination_data, ot_hours_exists: othoursExistsInPayroll };
    }

    return {status: false}
      // expenseData: empExpense,
};

const pdfData = async (condition, page, limit) => {

    var indexResponse = await index(condition, page, limit)
    var currencySymbol  = await indexRepository.find('organization', ['currency_symbol'])
    if (indexResponse.status) {
        indexResponse = indexResponse.data[0]
        const pdfObject = {
            payroll_configuration_id: indexResponse.payroll_configuration_id,
            period: indexResponse.period,
            employee_id: indexResponse.employee_id,
            employee_name: indexResponse.employee_name,
            visa_name: indexResponse.visa_name,
            net_amount: parseFloat(indexResponse.net_amount).toFixed(2),
            balance_amount: parseFloat(indexResponse.balance_amount).toFixed(2),
            deduction: parseFloat(indexResponse.deduction).toFixed(2),
            reimbursement: parseFloat(indexResponse.reimbursement).toFixed(2),
            total_amount: parseFloat(indexResponse.total_amount).toFixed(2),
            amount_paid: parseFloat(indexResponse.amount_paid).toFixed(2),
            comments: indexResponse.comments,
            placement_information: indexResponse.placement_information,
            currency_symbol: currencySymbol.status ? currencySymbol.data[0].currency_symbol : "",
        }
        var payrollDetails = await payrollInformationData.payrollThemeInfo(pdfObject, true);
        responseData = {
            status: true,
            data: payrollDetails
        }
    } else {
        responseData = {
            status: false,
            data: [],
            error: ''
        }
    }

    return responseData
}

/**
 * Retrieves payroll invoices
 * @param {object} condition - The condition to filter the payment details.
 * @returns {object} An object containing the payment details, pagination data, and status.
 */
const getInvoiceStatusForPayrollHours = async (condition) => {

    let checkCondition = {
        global_search: `"timesheet_hours"."date" >= '${condition.from}' and "timesheet_hours"."date" <= '${condition.to}' and "employee"."id" = '${condition.id}' and "timesheet_hours"."invoice_raised" = false`
    }
    const joins = [
        { table: 'timesheets', alias: 'timesheets', condition: ['timesheets.id', 'timesheet_hours.timesheet_id'] },
        { table: 'placements', alias: 'placements', condition: ['placements.id', 'timesheets.placement_id'] },
        { table: 'employee', alias: 'employee', condition: ['employee.id', 'placements.employee_id'] },
    ];
    var payrollData = await indexRepository.count('timesheet_hours', checkCondition, joins)

    if (payrollData.data == 0) {
        return { status: true };
    } else {
        return { status: false };
    }
};

/**
 * Finalizes payroll payments based on the provided finalize_ids:
 * - Initiates a database transaction using the 'trx' variable.
 * - Updates the 'is_finalize' field to true for the specified payroll payment records in 'payroll_payment_details' table.
 * - Commits the transaction upon successful updates.
 * - Returns an object with a status indicating the success or failure of the operation.
 *
 * @param {object} req - Request object containing 'finalize_id' for the payroll payments to be finalized.
 * @returns {object} - Object with 'status' indicating the success or failure of the operation.
 */
const payrollFinalize = async (req) => {

    let trx;
    try {

        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        const finalizeIds = req.finalize_id;

        for (const id of finalizeIds) {
            await transactionRepository.update(trx, 'payroll_payment_details', { id: id }, { is_finalize: true });
        }
        // transaction commit
        await trx.commit();
        // transaction commit

        /** Activity track */

        return { status: true };
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Fetches payment details for payroll listings based on conditions, pagination, and other data retrieval.
 *
 * @param {object} condition - Conditions for filtering payments.
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Limit of items per page for pagination.
 * @returns {object} - Result containing payment details, categorized and paginated.
 *
 * Logic:
 * - Fetch payment details based on provided conditions.
 * - Process the retrieved payment details and prepare categorized response data.
 * - Calculate various aspects such as payroll period, expenses, placement status, etc.
 * - Categorize payment details based on employee types, placement status, and other criteria.
 * - Create an organized response object containing categorized payment details.
 * - Return the constructed response object along with pagination details, payroll period, and other indicators.
 */
const finalizeListing = async (condition, page, limit) => {

    /**
     * Fetching the payment details
     */
    const fields = ['payroll_payment_details.*',
        //  'pc.from_date', 'pc.status', 'pc.to_date',
        'emp.display_name as employee_name', 'emp.balance_amount as current_available_balance', 'emp.standard_pay_amount', 'emp.id as employee_id', 'emp.reference_id as employee_reference_id', 'emp.profile_picture_url',
        //   'employee_categories.name as employee_categorie_name', 
        'emp.status', 'emp.sub_status', 'emp.employment_type_id',
        'visa_types.name as visa_type_name'
    ]
    const joins = [
        { table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'payroll_payment_details.employee_id'] },
        { table: 'visa_types', alias: 'visa_types', condition: ['emp.visa_type_id', 'visa_types.id'], type: 'left' },
        // { table: 'employee_categories', alias: '', condition: ['emp.employee_category_id', 'employee_categories.id'], type: 'left' },
        // { table: 'payroll_configuration as pc', alias: 'pc', condition: ['pc.id', 'payroll_payment_details.payroll_configuration_id'] },
    ]
    var payrollData = await indexRepository.findByPagination('payroll_payment_details', fields, condition, joins, page, limit, 'LOWER(emp.display_name) ASC', 'raw', false)

    if (payrollData.status) {
        let finalizedEmployees = [];
        let responseData = [];
        let unFinalizedEmployees = [];
        let finalizeSno = 0;
        let unFinalizedSno = 0;

        var pagination_details = payrollData.pagination;
        /* Prepare the response */
        serial_no = (page - 1) * limit + 1;
        for (let key in payrollData.data) {
            var item = payrollData.data[key];

            let placementInformation = await payrollPlacementInfo({ 'payroll.payroll_configuration_id': item.payroll_configuration_id, 'payroll.employee_id': item.employee_id }, 0, 1);

            let finalObject = [];
            // let placements_exists_information = [];
            // if (placementInformation.status) {
            //     placementInformation.data.forEach(element => {
            //         if (element.payroll_information.length > 0) {
            //             placements_exists_information.push(element)
            //         }
            //     });
            // }

            for (let key in placementInformation.data) {

                var finalobject = {
                    client_name: placementInformation.data[key].client_name,
                    visa_type_name: item.visa_type_name ? item.visa_type_name : '-',
                    hours: placementInformation.data[key].payroll_information[0] ? placementInformation.data[key].payroll_information[0].hours : 0,
                    pay_rate: placementInformation.data[key].payroll_information[0] ? placementInformation.data[key].payroll_information[0].pay_rate : 0,
                    amount: placementInformation.data[key].payroll_information[0] ? placementInformation.data[key].payroll_information[0].total_amount_payable : 0
                }
                finalObject.push(finalobject)
            }

            listingObject = {
                employee_name: item.employee_name,
                employee_id: item.employee_id,
                employee_reference_id: item.employee_reference_id,
                employee_profile_url: item.profile_picture_url ? item.profile_picture_url : '',
                is_finalize: item.is_finalize ? item.is_finalize : false,
                salary_amount: item.amount_paid ? item.amount_paid : '',
                comments: item.comments ? item.comments : '',
                net_payable_amount: (item.amount_paid + item.credited_expense) - item.debited_expense,
                balance: item.balance_amount,
                expense_reimbursement: item.credited_expense,
                placementObject: finalObject

            }

            if (item?.is_finalize) {
                finalizeSno += 1;
                listingObject.sno = finalizeSno;
                finalizedEmployees.push(listingObject)
            } else {
                unFinalizedSno += 1;
                listingObject.sno = unFinalizedSno;
                unFinalizedEmployees.push(listingObject)
            }
        }

        let tempResponse = {
            'finalized_employees': finalizedEmployees,
            'unFinalized_employees': unFinalizedEmployees

        }
        responseData.push(tempResponse);

        return { status: true, data: responseData, pagination_data: pagination_details };
    } else {
        return payrollData;
    }
}

/**
 * Fetches payment details for payroll listings based on conditions, pagination, and other data retrieval.
 *
 * @param {object} condition - Conditions for filtering payments.
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Limit of items per page for pagination.
 * @returns {object} - Result containing payment details, categorized and paginated.
 *
 * Logic:
 * - Fetch payment details based on provided conditions.
 * - Process the retrieved payment details and prepare categorized response data.
 * - Calculate various aspects such as payroll period, expenses, placement status, etc.
 * - Categorize payment details based on employee types, placement status, and other criteria.
 * - Create an organized response object containing categorized payment details.
 * - Return the constructed response object along with pagination details, payroll period, and other indicators.
 */
const finalizedEmployee = async (condition) => {

    /**
     * Fetching the payment details
     */
    const fields = ['payroll_payment_details.*',
        //  'pc.from_date', 'pc.status', 'pc.to_date',
        'emp.display_name as employee_name', 'emp.balance_amount as current_available_balance', 'emp.standard_pay_amount', 'emp.id as employee_id', 'emp.reference_id as employee_reference_id', 'emp.profile_picture_url',
        'emp.status', 'emp.sub_status', 'emp.employment_type_id'
    ]
    const joins = [
        { table: 'employee as emp', alias: 'emp', condition: ['emp.id', 'payroll_payment_details.employee_id'] }
    ]
    var payrollData = await indexRepository.find('payroll_payment_details', fields, condition, null, joins, null, null, null, false)

    if (payrollData.status) {
        let responseData = [];
        let net_payable_amount = 0


        /* Prepare the response */
        for (let key in payrollData.data) {
            var item = payrollData.data[key];

            listingObject = {
                employee_name: item.employee_name,
                employee_id: item.employee_id,
                employee_reference_id: item.employee_reference_id,
                employee_profile_url: item.profile_picture_url ? item.profile_picture_url : '',
                is_finalize: item.is_finalize ? item.is_finalize : false,
                salary_amount: item.amount_paid ? item.amount_paid : '',
                net_payable_amount: (item.amount_paid + item.credited_expense) - item.debited_expense,
                expense_reimbursement: item.credited_expense,
            }
            net_payable_amount += listingObject.net_payable_amount
            responseData.push(listingObject)
        }

        return { status: true, data: responseData, net_payable_amount: net_payable_amount };
    } else {
        return payrollData;
    }
}

/**
 * Updates payroll and employee records based on the provided body object.
 * @param {Object} body - The body object containing the updated payroll details.
 * @returns {Array} - An array of responses for each updated record.
 */
const update = async (body) => {
    let trx;
    try {
        let response = [];

        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        for (let key in body.employees) {
            let item = body.employees[key]; // Assign to a varibale

            var payroll_date = null;
            if (payroll_date == null) {
                /* Fetching the Payroll Generate Dates Information */
                let payrollData = await indexRepository.find('payroll_configuration', ['to_date'], { id: item.payroll_configuration_id }, null, [], null, null, null, false);
                payroll_date = moment(payrollData.data[0].to_date).format('YYYY-MM-DD')
            }
            /* Fetching the Payroll Generate Dates Information */

            // Fetch the current payroll_payment_details
            let payrollPaymentcondition = { 'employee_id': item.employee_id, 'payroll_configuration_id': item.payroll_configuration_id };

            // Credit expenses condition
            let creditCondition = {
                'employee_id': item.employee_id,
                'expense_effect_on': 1, // payroll effect expense
                "expense_transaction_type": 1,  //Reumbesmet falg
                'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and "raised_date" <= '${payroll_date}'`
            };

            // Debit expense condition
            let debitCondition = {
                'employee_id': item.employee_id,
                'expense_effect_on': 1, // payroll effect expense
                "expense_transaction_type": 2, //deduction falg
                'global_search': `("status" IN('Deduction In Progress', 'Reimbursement In Progress', 'Submitted', 'Approved')) and("enable_approval" = false or("enable_approval" = true and "approved_date" is not null)) and  "raised_date" <= '${payroll_date}'`
            }

            var payrollData = await indexRepository.sum('payroll_payment_details', payrollPaymentcondition, 'total_amount', [], false);
            total_amount_payable = payrollData.data

            // Fetch the expenses details
            let creditexpense = await indexRepository.sum('expense_management', creditCondition, 'due_amount'); // Total reimbusment amount
            let reimbusment_total_amount = creditexpense.status ? creditexpense.data : 0;

            let debitexpense = await indexRepository.sum('expense_management', debitCondition, 'due_amount') // Current payroll due amount
            let debitexpense_total_amount = debitexpense.status ? debitexpense.data : 0;

            let balance_amount = parseFloat(total_amount_payable) - parseFloat(item.amount_paid); //removed expense calculation, reason: 

            /**
             * Fetch Payroll employee information
             */
            let payrollEmployeeData = await indexRepository.find('employee', ['balance_amount', 'hours_worked', 'employment_type_id'], { id: item.employee_id }); // Employee Information

            // if (payrollEmployeeData.data[0].employment_type_id == 1) { //Internal Employee
            //     balance_amount = 0
            // }

            if (item.is_draft == true) {
                let updateAmount = {
                    amount_paid: item.amount_paid,
                    is_finalize: item.is_finalize,
                    balance_amount: balance_amount,
                    credited_expense: reimbusment_total_amount,
                    debited_expense: debitexpense_total_amount,
                    updated_by: body.updated_by,
                    comments: item.comments ? item.comments : null,
                    updated_at: new Date()
                };
                await transactionRepository.update(trx, 'payroll_payment_details', payrollPaymentcondition, updateAmount)
            } else {

                /**
                 * Join tables to fetch the expense information
                 */
                const fields = ['expense_management.*', 'emt.name as expense_type']
                const joins = [
                    { table: 'expense_and_service_types as emt', alias: 'emt', condition: ['expense_management.expense_type_id', 'emt.id'] }
                ]

                /**
                 * Fetch all credit expenses
                 */
                let creditExpensesManagement = await indexRepository.find('expense_management', fields, creditCondition, null, joins);

                /**
                 * Fetch all debit expenses
                 */
                let debitExpensesManagement = await indexRepository.find('expense_management', fields, debitCondition, null, joins);

                /**
                 * Credit Expenses Reimbusment through payroll
                 */
                if (creditExpensesManagement.status) {
                    for (let keys in creditExpensesManagement.data) {
                        let expense = creditExpensesManagement.data[keys];
                        let is_recurring = expense.is_recurring;
                        let updateCreditExpenses;

                        if (is_recurring) {
                            let recurring_count = expense.recurring_count ? expense.recurring_count : 0;
                            if (recurring_count > 0) {
                                var status;
                                if(recurring_count - 1 == 0) {
                                    status = 'Processed'
                                } else {
                                    status = 'Reimbursement In Progress'
                                }
                                updateCreditExpenses = {
                                    recurring_count: recurring_count - 1,
                                    status: status
                                }
                                await transactionRepository.update(trx,'expense_management', { id: expense.id }, updateCreditExpenses);
                            }
                        } else {
                            updateCreditExpenses = {
                                due_amount: 0,
                                status: 'Processed',
                            }
                            await transactionRepository.update(trx,'expense_management', { id: expense.id }, updateCreditExpenses);
                        }

                        /**
                         * Store the deduction expenses
                         */
                        var deductionObject = {
                            expense_id: expense.id,
                            amount: reimbusment_total_amount,
                            payroll_configuration_id: item.payroll_configuration_id,
                            transaction_date: moment().format('YYYY-MM-DD'),
                            created_at: new Date(),
                            created_by: body.created_by
                        }
                        await transactionRepository.store(trx, 'expense_transaction_track', deductionObject); // Store the deduction information
                    }
                }

                /**
                 * Deduct expenses from the payroll.
                 * Update the deduction due amount and amount paid based on conditions
                 */
                if (debitExpensesManagement.status) {
                    for (let keys in debitExpensesManagement.data) {
                        let expense = debitExpensesManagement.data[keys];

                        var total_previous_deductions = await indexRepository.sum('expense_transaction_track', { expense_id: expense.id }, 'amount'); // Fetch the previous deduction amount

                        let due_amount = expense.due_amount;
                        let earlier_amount_paid = total_previous_deductions.status ? total_previous_deductions.data : 0;

                        let updateDebitExpenses;
                        /**
                         * Update the expenses based on goal condition
                         */
                        if (expense.has_goal_amount) {
                            let goal_amount = expense.goal_amount;
                            let temp_due_amount = (goal_amount) - (earlier_amount_paid + due_amount);
                            let updated_due_amount;
                            if (temp_due_amount > due_amount) {
                                updated_due_amount = due_amount
                            } else {
                                updated_due_amount = temp_due_amount
                            }
                            updateDebitExpenses = {
                                due_amount: updated_due_amount,
                                status: updated_due_amount == 0 ? 'Processed' : 'Deduction In Progress',
                            }
                        } else {
                            updateDebitExpenses = {
                                due_amount: due_amount,
                                status: due_amount == 0 ? 'Processed' : 'Deduction In Progress',
                            }
                        }
                        await transactionRepository.update(trx,'expense_management', { id: expense.id }, updateDebitExpenses)

                        /**
                         * Store the deduction expenses
                         */
                        var deductionObject = {
                            expense_id: expense.id,
                            amount: due_amount,
                            payroll_configuration_id: item.payroll_configuration_id,
                            transaction_date: moment().format('YYYY-MM-DD'),
                            created_at: new Date(),
                            created_by: body.created_by
                        }
                        await transactionRepository.store(trx,'expense_transaction_track', deductionObject); // Store the deduction information
                    }
                }

                let updateAmount = {
                    amount_paid: item.amount_paid,
                    is_finalize: item.is_finalize,
                    balance_amount: balance_amount,
                    credited_expense: reimbusment_total_amount,
                    debited_expense: debitexpense_total_amount,
                    updated_by: body.updated_by,
                    comments: item.comments ? item.comments : null,
                    updated_at: new Date()
                };
                await transactionRepository.update(trx,'payroll_payment_details', payrollPaymentcondition, updateAmount);


                let hoursWorkedOnPayperiod = await indexRepository.find('payroll_payment_details', ['worked_hours'], payrollPaymentcondition, 1, [], null, null, null, true); // Fetch Payroll payment details

                let updatedHoursWorked = payrollEmployeeData.data[0].hours_worked + hoursWorkedOnPayperiod.data[0].worked_hours;
                let empLatestBalance = payrollEmployeeData.data[0].balance_amount + parseFloat(balance_amount);

                await transactionRepository.update(trx,'employee', { id: item.employee_id }, { balance_amount: empLatestBalance, hours_worked: updatedHoursWorked });

            }
        }
        trx.commit();
        return { status: true, data: response };
    } catch (error) {
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Handles the process of marking payroll as skipped.
 *
 * @param {object} body - The request body containing payroll configuration details.
 * @returns {object} - The result of updating payroll configuration.
 *
 * Logic:
 * - Update the status of the payroll configuration to 'skipped'.
 * - Return the result of updating the payroll configuration.
 */
const payrollSkip = async (body) => {
    // Mark Payroll as skipped
    let updateData = {
        status: 'Skipped', // is skipped
        updated_at: new Date(),
        updated_by: body.updated_by
    }
    var payrollData = await indexRepository.update('payroll_configuration', { id: body.payroll_configuration_id }, updateData)
    return payrollData;
}


module.exports = { index, pdfData, update, getInvoiceStatusForPayrollHours, payrollFinalize, balanceSheetIndexCard, generatePayroll, payrollPaymentInfo1, payrollPaymentInfo, calculatePayRates, getSinglePlacementTotalHours, paymentsListing, payrollRun, submitPayroll, finalizeListing, finalizedEmployee, payrollSkip }