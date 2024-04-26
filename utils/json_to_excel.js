const moment = require('moment');
const ExcelJS = require('exceljs');
const { exportPath, exportURL } = require('../config/app');

const convertJsonToExcelEmployee = async (data, filename) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(filename);

  worksheet.columns = Object.keys(data[0]).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  const date = moment(new Date()).format('YYYYMMDDhhmmss');
  const filePath = exportPath + '/' + filename + '-' + date + '.xlsx';
  await workbook.xlsx.writeFile(filePath);
  const Path = exportURL + filename + '-' + date + '.xlsx';

  return Path;
};

// fucntion for converting json to excel of payment
const convertJsonToExcelPayment = async (data, filename, date1, date2) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(filename);

  // Set the payment header
  const paymentHeaderRow = worksheet.addRow(['Payment']);
  paymentHeaderRow.getCell('A').alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A1:${String.fromCharCode(64 + Object.keys(data[0]).length)}1`);
  paymentHeaderRow.font = { bold: true };
  paymentHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFA9A9A9' },
  };

  // Set the dates between header
  const datesBetweenHeaderRow = worksheet.addRow([`Dates from ${date1} to ${date2}`]);
  datesBetweenHeaderRow.getCell('A').alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A2:${String.fromCharCode(64 + Object.keys(data[0]).length)}2`);
  datesBetweenHeaderRow.font = { bold: true };

  // Set the data headers
  const headers = Object.keys(data[0]);
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };

  data.forEach((row) => {
    const rowData = headers.map((header) => row[header]);
    worksheet.addRow(rowData);
  });

  const date = moment(new Date()).format('YYYYMMDDhhmmss');
  const filePath = exportPath + '/' + filename + '-' + date + '.xlsx';
  await workbook.xlsx.writeFile(filePath);
  const Path = exportURL + filename + '-' + date + '.xlsx';
  return Path;
};

const convertJsonToExcelCommon = async (data1, filename, data2, workbookName) => {
  const workbook = new ExcelJS.Workbook(); // Create a workbook
  const companyWorksheet = workbook.addWorksheet(workbookName.name1); // create a worksheet for respective details
  const contactWorksheet = (workbookName.name2) ? workbook.addWorksheet(workbookName.name2) : ''; // Create a worksheet for respective details

  // For Company Details Worksheet
  if (data1 && data1.length > 0) {
    companyWorksheet.columns = Object.keys(data1[0]).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    // Style headers with bold formatting
    companyWorksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    data1.forEach((row) => {
      companyWorksheet.addRow(row);
    });
  } else {
    // Add message to worksheet indicating no data was found
    companyWorksheet.addRow(['No data found']);
  }

  // For Contact Details Worksheet
  if (data2 && data2.length > 0) {
    contactWorksheet.columns = Object.keys(data2[0]).map((key) => ({
      header: key,
      key,
      width: 15,
    }));
    // Style headers with bold formatting
    contactWorksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    data2.forEach((row) => {
      contactWorksheet.addRow(row);
    });
  } else if (workbookName.name2) {
    // Add message to worksheet indicating no data was found
    contactWorksheet.addRow(['No data found']);
  }

  // Write the file
  const date = moment(new Date()).format('YYYYMMDDhhmmss');
  const filePath = exportPath + '/' + filename + '-' + date + '.xlsx';
  await workbook.xlsx.writeFile(filePath);
  const Path = exportURL + filename + '-' + date + '.xlsx';
  return Path;
};

const convertJsonToExcelTimesheet = async (data, dates, filename, datesbetween) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(filename);

  // setting the dates
  let fromDate = datesbetween[0];
  let toDate = datesbetween[1];

  //setting the heading for first row
  const paymentHeaderRow = worksheet.addRow(['Timesheet']);
  paymentHeaderRow.getCell('A').alignment = { horizontal: 'center' };
  paymentHeaderRow.font = { bold: true };

  // Set the dates between header
  const datesBetweenHeaderRow = worksheet.addRow([`Dates from ${fromDate} to ${toDate}`]);
  datesBetweenHeaderRow.getCell('A').alignment = { horizontal: 'center' };
  datesBetweenHeaderRow.font = { bold: true };

  // Set the data headers
  const headers = Object.keys(data[0]);
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };

  // looping the total data to get the dates assigned to the values
  for (let i = 1; i < data.length; i++) {
    let dates_object = dates;
    var row_count = worksheet.rowCount + 1;
    row = data[i];

    // adding the first six constant values 
    const rowData = Object.values(row);
    const eachRow = rowData.slice(0, 6);
    worksheet.addRow(eachRow);

    // deleting the added six constant values to loop the dates
    delete row['SNo'];
    delete row['Total Hours'];
    delete row['Employee Name'];
    delete row['Employee Id'];
    delete row['Client Name'];
    delete row['Client Id'];

    //assigning the avaliable dates the dates avaliable as columns
    for (const [key, value] of Object.entries(row)) {
      dates_object[key] = value;
    }
    const date_in_order = Object.values(dates_object);


    // splitting the values in dates to get the status of the date (if its approved or rejected or submitted)
    let start = 7;
    for (let j = 0; j < date_in_order.length; j++) {
      const dateCellValue = date_in_order[j];
      const dateValueParts = dateCellValue === 0 ? [0] : dateCellValue.split('-');
      // getting cell value
      const cell = worksheet.getCell(row_count, start + j);

      // setting the value for non avaliable dates
      if (dateValueParts[0] === 0) {
        cell.value = ''; // Set the value to 0 directly
      } else {
        // assigning colours based upon their status
        if (dateValueParts[1] === '3' && dateValueParts[0] != '00:00:00') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '00FF00' }, // Green color
          };
        } else if (dateValueParts[1] === '4' && dateValueParts[0] != '00:00:00') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0000' }, // Red color
          };
        } else if (dateValueParts[1] === '2' && dateValueParts[0] != '00:00:00') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' }, // Yellow color
          };
        } else if (dateValueParts[1] === '1' && dateValueParts[0] != '00:00:00') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF00' }, // Yellow color
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCC' }, // cream color
          };
        }

        cell.value = dateValueParts[0];
      }
    }
  }

  // adding empty rows
  const emptyRowsToadd = 4;
  for (let h = 0; h < emptyRowsToadd; h++) {
    worksheet.addRow([]);
  }

  // adding reference data for colour coding
  for (let k = 0; k < emptyRowsToadd; k++) {
    // adding colour heading and bordes
    cellColour = worksheet.getCell(row_count + 3, 2);
    cellColour.value = 'Colour';
    cellColour.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // adding status heading and bordes
    cellStatus = worksheet.getCell(row_count + 3, 3);
    cellStatus.value = 'Status';
    cellStatus.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // adding pattern, border and colour to reference cells
    const cell = worksheet.getCell(row_count + 4 + k, 2);
    if (k == 0) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF00' }, // Yellow color
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      const cells = worksheet.getCell(row_count + 4 + k, 3 + k);
      cells.value = 'Submitted or Partially Approved';
      cells.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    } else if (k == 1) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '00FF00' }, // Green color
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      const cells = worksheet.getCell(row_count + 4 + k, 2 + k);
      cells.value = 'Approved';
      cells.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    } else if (k == 2) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0000' }, // Red color
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      const cells = worksheet.getCell(row_count + 4 + k, 1 + k);
      cells.value = 'Rejected';
      cells.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    } else if (k == 3) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCC' }, // cream color
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      const cells = worksheet.getCell(row_count + 4 + k, k);
      cells.value = 'Not Filled';
      cells.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    }
  }

  // adding file name and file path
  const date = moment(new Date()).format('YYYYMMDDhhmmss');
  const filePath = exportPath + '/' + filename + '-' + date + '.xlsx';
  await workbook.xlsx.writeFile(filePath);
  const Path = exportURL + filename + '-' + date + '.xlsx';
  return Path;
};

const convertJsonToExcel = async (excelInfo, fileName) => {

  const workbook = new ExcelJS.Workbook(); // Create a workbook

  excelInfo.forEach(excel => {
    const worksheet = workbook.addWorksheet(excel?.filename);

    let data = excel?.excelData;
    if (data && data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key,
        width: 15,
      }));

      // Style headers with bold formatting
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      data.forEach((row) => {
        worksheet.addRow(row);
      });
    }
  });

  // Write the file
  const date = moment(new Date()).format('YYYYMMDDhhmmss');
  const filePath = exportPath + '/' + fileName + '-' + date + '.xlsx';
  await workbook.xlsx.writeFile(filePath);
  const Path = exportURL + fileName + '-' + date + '.xlsx';
  return Path;
};

module.exports = { convertJsonToExcelPayment, convertJsonToExcelCommon, convertJsonToExcelEmployee, convertJsonToExcelTimesheet, convertJsonToExcel };




