const { toTitleCase } = require("../../../../../../helpers/globalHelper");
const { convertJsonToExcelCommon, convertJsonToExcel } = require("../../../../../../utils/json_to_excel");
const indexRepository = require('../../../repositories/index');

const exportPayrollInfo = async (excelData) => {

    excelData = excelData.data;
    if (excelData && excelData.length > 0) {
        await Promise.all(
            excelData.map(async obj => {
                await Promise.all(Object.entries(obj).map(async ([key, value]) => {
                    let oldKey = key;
                    let tempValue = obj[key];
                    let newKey = await toTitleCase(key);
                    obj[newKey] = tempValue;
                    delete obj[oldKey];
                }));
            })
        );
    }

    if (excelData && excelData.length > 0) {
        excelData = excelData[0];
        let excelInfo = {};
        excelInfo = {
            'excelData': excelData,
            'filename': 'Payroll'
        }
        const excelfile = await convertJsonToExcel(excelInfo);
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return excelData;
    }
}

module.exports = { exportPayrollInfo }