const moment = require('moment');

const getTimesheetDays = (cycle_id, day_start_id, ts_start_date, max_end_date = null) => {
	var start_date = moment(ts_start_date).format('YYYY-MM-DD')
	var start_day = moment(start_date).day()

	switch (cycle_id) {
		case 1: //Weekly Cycle
			if (day_start_id <= start_day) {
				var end_date = moment(start_date).add(6 - (start_day - day_start_id), 'days').format('YYYY-MM-DD')
			} else {
				var end_date = moment(start_date).add(day_start_id - start_day - 1, 'days').format('YYYY-MM-DD')
			}
			var cycle_days = moment(end_date).diff(start_date, 'days');
			break;
		case 2: // Bi weekly cycle
			if (day_start_id <= start_day) {
				var end_date = moment(start_date).add(13 - (start_day - day_start_id), 'days').format('YYYY-MM-DD')
			} else {
				var end_date = moment(start_date).add(6 + (day_start_id - start_day), 'days').format('YYYY-MM-DD')
			}
			var cycle_days = moment(end_date).diff(start_date, 'days');
			break;
		case 3:  // Semi Month Cycle
			var date = moment(start_date).date();
			if (date <= 15) {
				var cycle_days = 15 - date;
				var month = moment(start_date).month();
				var year = moment(start_date).year();
				var end_date = moment({ year: year, month: month, days:15}).format('YYYY-MM-DD');
			}
			else {
				var no_of_days = moment(start_date).daysInMonth();
				var cycle_days = no_of_days - date;
				var end_date = moment(start_date).endOf('month').format('YYYY-MM-DD');
			}
			break;
		case 4: // Monthly Cycle
			var date = moment(start_date).date();
			var no_of_days = moment(start_date).daysInMonth();
			var end_date = moment(start_date).endOf('month').format("YYYY-MM-DD");
			var cycle_days = no_of_days - date;
			break;
		default:
			break;
	}
	if (cycle_days <= 6) { var weeks = 1; }
	if (cycle_days > 6 && cycle_days <= 13) { var weeks = 2; }
	if (cycle_days > 13 && cycle_days <= 20) { var weeks = 3; }
	if (cycle_days > 20 && cycle_days <= 27) { var weeks = 4; }
	if (cycle_days > 27 && cycle_days <= 31) { var weeks = 5; }

	if(max_end_date){
		const project_end_date = moment(max_end_date).format('YYYY-MM-DD');
		if(end_date > project_end_date){
			end_date = project_end_date;
		}
	}

	return { start_date, end_date, cycle_days, weeks }
}

const getInvoiceDays = (invoice_start_date, cycle_id, day_start_id) => {
  let start_date = moment(invoice_start_date).format('YYYY-MM-DD');
  let start_day = moment(start_date).day();

  switch (cycle_id) {
  case 1:
    if (day_start_id <= start_day) {
      var end_date = moment(start_date).add(6 - (start_day - day_start_id), 'days').format('YYYY-MM-DD');
    } else {
      var end_date = moment(start_date).add(day_start_id - start_day - 1, 'days').format('YYYY-MM-DD');
    }
    var cycle_days = moment(end_date).diff(start_date, 'days');
    break;
  case 2:
    if (day_start_id <= start_day) {
      var end_date = moment(start_date).add(13 - (start_day - day_start_id), 'days').format('YYYY-MM-DD');
    } else {
      var end_date = moment(start_date).add(6 + day_start_id - start_day, 'days').format('YYYY-MM-DD');
    }
    var cycle_days = moment(end_date).diff(start_date, 'days');
    break;
  case 3:
    var date = moment(start_date).date();
    if (date < 15) {
      var cycle_days = 15 - date;
      let month = moment(start_date).month();
      let year = moment(start_date).year();
      var end_date = moment(year + month + cycle_days).format('YYYY-MM-DD');
    }
    else {
      var no_of_days = moment(start_date).daysInMonth();
      var cycle_days = no_of_days - date;
      var end_date = moment(start_date).endOf('month').format('YYYY-MM-DD');
    }
    break;
  case 4:
    var date = moment(start_date).date();
    var no_of_days = moment(start_date).daysInMonth();
    var end_date = moment(start_date).endOf('month').format('YYYY-MM-DD');
    var cycle_days = no_of_days - date;
    break;
  default:
    break;
  }
  return { start_date, end_date, cycle_days };
};

const timeStringToFloat = (time) => {
  let hoursMinutes = time.split(/[.:]/);
  let hours = parseInt(hoursMinutes[0], 10);
  let minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
  return hours + minutes / 60;
};

const hoursTohhmm = (minutes) => {
  let sign = minutes < 0 ? '-' : '';
  let min = Math.floor(Math.abs(minutes));
  let sec = Math.floor((Math.abs(minutes) * 60) % 60);
  return sign + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
};

function getMonthDateRange(year, month) {
  // month in moment is 0 based, so 9 is actually october, subtract 1 to compensate
  // array is 'year', 'month', 'day', etc
  let startDate = moment([year, month]).format('YYYY-MM-DD');

  // Clone the value before .endOf()
  let endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

  // make sure to call toDate() for plain JavaScript date type
  return [startDate, endDate];
}

/**
 * Function to calculate the weeks in the given
 * @param {*} year 
 * @param {*} month 
 * @param {*} weekEndDay 
 * @returns 
 */
function calculateWeeksOld(year, month, weekEndDay) {
  let leapYear = (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
  let formatMonth = (month).toString().padStart(2, '0');
  let startDate = `${year}-${formatMonth}-01`;
  if(month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
    end_day = 31;
  }else if(month === 4 || month === 6 || month === 9 || month === 11){
    end_day = 30;
  }else{
    if(leapYear){
      end_day = 29;
    }else{
      end_day = 28;
    }
  }
  let endDate = `${year}-${formatMonth}-${end_day}`;
  let weekEndDate= 'Monday';
  const weeks = [];

  let date = moment(startDate);
  let startdate = date.format('YYYY-MM-DD')
  const StartPeriod = startdate;

  const date1 = moment(endDate);
  let eddate = date1.format('YYYY-MM-DD')
  const EndPeriod = eddate;

  for(i = 1; i <= 31; i++){

    // Add one day to the date
    let newTempDate = date.add(1, 'days');
    const newDateOfWeek = newTempDate.format('dddd');
    let abcd = newTempDate.format('YYYY-MM-DD');
    let bbc = moment(abcd).subtract(1, 'days').format('YYYY-MM-DD');
    let endate = bbc;
    if(newDateOfWeek == weekEndDate || eddate == bbc){
      weeks.push({
        start: startdate,
        end: endate
      });
      startdate = abcd;
    }
  }

 return { period : weeks, start_date : StartPeriod, end_date : EndPeriod };
}


/**
 * Generates an array of objects, each representing a week within a specified date range.
 *
 * @param {object} condition - An object containing 'from_date' and 'to_date' properties representing the date range.
 * @returns {object} - An object containing an array of periods (weeks) and the start and end dates of the specified range.
 *
 * Logic:
 * - Parses 'from_date' and 'to_date' from the 'condition' object into Moment objects.
 * - Initializes an empty array 'weeks' to store the week periods.
 * - Sets the 'currentStart' variable as a clone of the 'fromMoment'.
 * - Iterates through each week within the date range using a while loop:
 *   - Sets 'currentEnd' as 'currentStart' plus six days (end of the week).
 *   - If 'currentEnd' exceeds 'toMoment', sets 'currentEnd' as 'toMoment'.
 *   - Pushes an object representing the week period into the 'weeks' array containing 'start' and 'end' date strings.
 *   - Updates 'currentStart' to the day after 'currentEnd' for the next iteration.
 * - Returns an object containing the array of periods (weeks) and the start and end dates of the specified range.
 */
function calculateWeeks(condition) {
  const fromMoment = moment(condition.from_date, 'YYYY-MM-DD');
  const toMoment = moment(condition.to_date, 'YYYY-MM-DD');

  let weeks = [];
  let currentStart = fromMoment.clone();

  while (currentStart.isSameOrBefore(toMoment)) {
    let currentEnd = currentStart.clone().add(6, 'days');
    if (currentEnd.isAfter(toMoment)) {
      currentEnd = toMoment;
    }

    weeks.push({
      start: currentStart.format('YYYY-MM-DD'),
      end: currentEnd.format('YYYY-MM-DD'),
    });

    currentStart = currentEnd.clone().add(1, 'day');
  }

  return {
    period: weeks,
    start_date: condition.from_date,
    end_date: condition.to_date,
  };
}


module.exports = { getTimesheetDays, getInvoiceDays, timeStringToFloat, hoursTohhmm, getMonthDateRange, calculateWeeks, calculateWeeksOld };