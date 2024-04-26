const AwaitEventEmitter = require('await-event-emitter').default;
let events = new AwaitEventEmitter();
const indexRepository = require('../src/v1/user/repositories/index');
const moment = require('moment');

/**
 * Event listener for the 'invoiceGenerationEmail' event. Retrieves necessary data from the database
 * and sends an email with the generated invoice.
 * @param {object} data - The data object containing the necessary information for generating the invoice email.
 * @returns None
 */
events.on('payrollCycleGeneration', async (payrollCondition) => {

    for(let loop = 0; loop<= 15; loop++){
        const payrollData = await indexRepository.find('payroll_config_settings', ['*'], {id : payrollCondition.id }, 1, [], null, null, null, true, null);
 
        if (payrollData.status) {
            for (let keys in payrollData.data) {
                payroll = payrollData.data[keys]
                if (moment(payroll.to_date).format('YYYY-MM-DD') <= moment().format('YYYY-MM-DD')) {
                    let FromDate = moment(payroll.from_date);
                    let ToDate = moment(payroll.to_date);
                    let checkDate = moment(payroll.check_date);
                    dateDifference = ToDate.diff(FromDate, 'days');
                    // frequencyDate = moment(payroll.frequency_date);
                    raiseDays = checkDate.diff(ToDate, 'days');
                    /* Creating new object */
    
                    let pay_config_from;
                    let pay_config_to;
                    let pay_config_check;
                    let newPayrollConfigSetting = {};
    
                    // checking the payroll cycle id for pay roll configuration 
                    if (payroll.payroll_cycle_id == 3 && payroll.second_from_date != null) {
                        // Re mapping second cycle details to first cycle - only for semi monthly
                        newPayrollConfigSetting.from_date = moment(payroll.second_from_date).format('YYYY-MM-DD');
                        newPayrollConfigSetting.to_date = moment(payroll.second_to_date).format('YYYY-MM-DD');
                        newPayrollConfigSetting.actual_check_date = moment(payroll.second_actual_check_date).format('YYYY-MM-DD');
                        newPayrollConfigSetting.check_date = moment(payroll.second_check_date).format('YYYY-MM-DD');
    
                        // New second cycle start date 
                        let temp11 = moment(payroll.second_to_date).add(1, 'days');
                        let newFromDate = new Date(temp11);
    
                        // New Second cycle end date
                        let modifiedDate = await generateOneMonthDate(payroll.second_from_date);
    
                        // New Second cycle actual check date
                        let temp3 = moment(payroll.actual_check_date).add(1, 'days').format('YYYY-MM-DD')
                        let temp33 = new Date(temp3);
                        let newActualCheckEndDate = await generateOneMonthDate(temp33);
                        let newActualcheckDate = new Date(newActualCheckEndDate);
    
                        // New Second cycle check date
                        let weekDayName = moment(newActualcheckDate).format('dddd');
                        let newcheckDate;
                        if (weekDayName === "Saturday") {
                            newcheckDate = moment(newActualcheckDate).subtract(1, "days");
                        } else if (weekDayName === "Sunday") {
                            newcheckDate = moment(newActualcheckDate).subtract(2, "days");
                        } else {
                            newcheckDate = moment(newActualcheckDate);
                        }
    
                        // second cycle details mapping
                        newPayrollConfigSetting.second_from_date = moment(newFromDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.second_to_date = modifiedDate;
                        newPayrollConfigSetting.second_actual_check_date = newActualCheckEndDate;
                        newPayrollConfigSetting.second_check_date = moment(newcheckDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.updated_by = null;
                        newPayrollConfigSetting.updated_at = new Date();
    
                        // Next run payroll information
                        pay_config_from = moment(payroll.second_from_date).format('YYYY-MM-DD');
                        pay_config_to = moment(payroll.second_to_date).format('YYYY-MM-DD');
                        pay_config_check = moment(payroll.second_check_date).format('YYYY-MM-DD');
    
                    } else if (payroll.payroll_cycle_id == 4) {
                        // add one day to the existing end date
                        let start = moment(payroll.to_date).add(1, 'days').format('YYYY-MM-DD');
                        let start1 = new Date(start);
    
                        // send cycle start date to calculate exact one month
                        let newEndDate = await generateOneMonthDate(start1);
    
                        // New cycle actual check date
                        let temp3 = moment(payroll.actual_check_date).add(1, 'days').format('YYYY-MM-DD');
                        let temp33 = new Date(temp3);
                        let newActualCheckEndDate = await generateOneMonthDate(temp33);
                        let newActualcheckDate = new Date(newActualCheckEndDate);
    
                        // New cycle check date
                        let weekDayName = moment(newActualcheckDate).format('dddd');
                        let newcheckDate;
                        if (weekDayName === "Saturday") {
                            newcheckDate = moment(newActualcheckDate).subtract(1, "days");
                        } else if (weekDayName === "Sunday") {
                            newcheckDate = moment(newActualcheckDate).subtract(2, "days");
                        } else {
                            newcheckDate = moment(newActualcheckDate);
                        }
    
                        // Update object
                        newPayrollConfigSetting.from_date = start;
                        newPayrollConfigSetting.to_date = newEndDate;
                        newPayrollConfigSetting.check_date = moment(newcheckDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.actual_check_date = newActualCheckEndDate;
                        newPayrollConfigSetting.updated_by = null;
                        newPayrollConfigSetting.updated_at = new Date()
    
                        // Next run payroll information
                        pay_config_from = start;
                        pay_config_to = newEndDate;
                        pay_config_check = moment(newcheckDate).format('YYYY-MM-DD');
    
                    } else if (payroll.payroll_cycle_id == 1 || 2 || 5) {
                        // previous two dates difference + 1  = new cycle end date
                        var newDate = moment(payroll.to_date).add(dateDifference + 1, 'days');
    
                        // actual check based on raise days
                        var newActualcheckDate = moment(newDate).add(raiseDays, 'days').format('YYYY-MM-DD');
    
                        // check date
                        var weekDayName = moment(newActualcheckDate).format('dddd');
                        let newcheckDate;
                        if (weekDayName === "Saturday") {
                            newcheckDate = moment(newActualcheckDate).subtract(1, "days");
                        } else if (weekDayName === "Sunday") {
                            newcheckDate = moment(newActualcheckDate).subtract(2, "days");
                        } else {
                            newcheckDate = moment(newActualcheckDate);
                        }
    
                        // Update object
                        newPayrollConfigSetting.from_date = moment(payroll.to_date).add(1, 'days').format('YYYY-MM-DD');
                        newPayrollConfigSetting.to_date = moment(newDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.check_date = moment(newcheckDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.actual_check_date = moment(newActualcheckDate).format('YYYY-MM-DD');
                        newPayrollConfigSetting.updated_by = null;
                        newPayrollConfigSetting.updated_at = new Date()
    
                        // Next run payroll information
                        pay_config_from = moment(payroll.to_date).add(1, 'days').format('YYYY-MM-DD');
                        pay_config_to = moment(newDate).format('YYYY-MM-DD');
                        pay_config_check = moment(newcheckDate).format('YYYY-MM-DD');
                    }
    
                    /* Creating new object */
                    var newPayrollConfig = {
                        pay_config_setting_id: payroll.id,
                        from_date: pay_config_from,
                        to_date: pay_config_to, 
                        check_date: pay_config_check,
                        status: 'Yet to generate',
                        created_by: null,
                        created_at: new Date()
                    };
                    /* Creating new object */
    
                    let condition = { id: payroll.id }
    
                    /** 
                     *  + Call the update function of payroll_config_settings repository
                     *  + Call the store function of payroll_confuguration repository
                     *    -Based on the status in store function response, segregate the response and prepare the response
                    */
                    await indexRepository.update('payroll_config_settings', condition, newPayrollConfigSetting);
                    await indexRepository.store('payroll_configuration', newPayrollConfig);
                }else{
                    loop = 16;
                    break;
                }
            }
        }else{
            loop = 16;
            break;
        }
    } 
});

/**
 * store a new payment mode object 
 * call repository function to store new entry into the collection.
 *
 * @param {date} date
 * @return Json
 * 
 */
const generateOneMonthDate = async (date) => {
    // New Second cycle end date
    let temp2 = moment(date);
    const inputDate = new Date(temp2);

    // Add 1 month
    const year = inputDate.getFullYear();
    const month = inputDate.getMonth() + 1;
    const day = inputDate.getDate();

    let newDate;
    let newMonth;
    let newYear;
    let leapYear = (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);

    if (!leapYear) {
        if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
            if (month == 1) {
                if (day == 1) {
                    newDate = 31;
                    newMonth = month;
                    newYear = year;
                } else if (day <= 28) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                }else if (day == 30 || day == 29) {
                    newDate = 27;
                    newMonth = month + 1;
                    newYear = year;
                } else {
                    newDate = 28;
                    newMonth = month + 1;
                    newYear = year;
                }
            } else {
                if (day == 1) {
                    newDate = 31;
                    newMonth = month;
                    newYear = year;
                } else if (day <= 30) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                    if (month == 12) {
                        newMonth = 1;
                        newYear = year + 1;
                    }
                } else {
                    if (month + 1 == 8) {
                        newDate = 30
                    } else {
                        newDate = 29
                    }

                    if (month == 12) {
                        newMonth = 1;
                        newYear = year + 1;
                        newDate = 30
                    } else {
                        newMonth = month + 1;
                        newYear = year;
                    }

                }
            }
        } else {
            if (month == 2) {
                if (day == 1) {
                    newDate = 28;
                    newMonth = month;
                    newYear = year;
                } else if (day < 28) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                } else {
                    newDate = 30;
                    newMonth = month + 1;
                    newYear = year;
                }
            } else {
                if (day == 1) {
                    newDate = 30;
                    newMonth = month;
                    newYear = year;
                } else if (day < 30) {
                    newMonth = month + 1;
                    newYear = year;
                    newDate = day - 1;
                } else {
                    newDate = 30;
                    newMonth = month + 1;
                    newYear = year;
                }
            }
        }
    } else {
        if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
            if (month == 1) {
                if (day == 1) {
                    newDate = 31;
                    newMonth = month;
                    newYear = year;
                } else if (day <= 29) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                }else if (day == 30) {
                    newDate = 28;
                    newMonth = month + 1;
                    newYear = year;
                } else {
                    newDate = 29;
                    newMonth = month + 1;
                    newYear = year;
                }
            } else {
                if (day == 1) {
                    newDate = 31;
                    newMonth = month;
                    newYear = year;
                } else if (day <= 30) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                    if (month == 12) {
                        newMonth = 1;
                        newYear = year + 1;
                    }
                } else {
                    if (month + 1 == 8) {
                        newDate = 30
                    } else {
                        newDate = 29
                    }

                    if (month == 12) {
                        newMonth = 1;
                        newYear = year + 1;
                        newDate = 30
                    } else {
                        newMonth = month + 1;
                        newYear = year;
                    }

                }
            }
        } else {
            if (month == 2) {
                if (day == 1) {
                    newDate = 29;
                    newMonth = month;
                    newYear = year;
                } else if (day < 29) {
                    newDate = day - 1;
                    newMonth = month + 1;
                    newYear = year;
                } else {
                    newDate = 31;
                    newMonth = month + 1;
                    newYear = year;
                }
            } else {
                if (day == 1) {
                    newDate = 30;
                    newMonth = month;
                    newYear = year;
                } else if (day < 30) {
                    newMonth = month + 1;
                    newYear = year;
                    newDate = day - 1;
                } else {
                    newDate = 30;
                    newMonth = month + 1;
                    newYear = year;
                }
            }
        }
    }
    const modifiedDate = moment([newYear, (newMonth - 1), newDate]).format('YYYY-MM-DD');
    return modifiedDate;
};

module.exports = { events };