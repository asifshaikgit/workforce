const { toTitleCase } = require("../../../../../../helpers/globalHelper");
const { convertJsonToExcelCommon } = require("../../../../../../utils/json_to_excel");
const indexRepository = require('../../../repositories/index');

const exportBalancesheetInfo = async () => {

    let salesQuery = `Select * from getBalancesheetExportData()`;
    excelData = await indexRepository.rawQuery(salesQuery);

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

        var workbookName = { name1: 'Balancesheet' };
        const excelfile = await convertJsonToExcelCommon(excelData, 'Balancesheet', [], workbookName);
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return excelData;
    }
}

module.exports = { exportBalancesheetInfo }