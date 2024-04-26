require('dotenv').config();
const path = require('path');
const ExcelJS = require('exceljs')

const convertExcelToJson = async (filePath, fileName) => {
    const workbook = new ExcelJS.Workbook();
    const excelFile = path.join(filePath, fileName);
    await workbook.xlsx.readFile(excelFile);

    const worksheet = workbook.getWorksheet(1);
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Modify column headers to lowercase with underscores
            row.eachCell((cell) => {
                const header = cell.value.toString().toLowerCase().replace(/ /g, '_');
                cell.value = header;
            });
        }
    });

    const jsonArray = []
    // Convert sheet to JSON format
    const rows = worksheet.getSheetValues().slice(1);
    const headers = worksheet.getRow(1).values;
    // const jsonArray = rows.map((row) => {
    for (const keys in rows) {
        if (keys != '0') {
            const obj = {};
                eachRow = rows[keys]
                for(let key in eachRow){
                obj[headers[key]] = eachRow[key];
            };
            jsonArray.push(obj)
        }
    }
    return jsonArray;
};

module.exports = { convertExcelToJson }