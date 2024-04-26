const { toTitleCase } = require("../../../../../../helpers/globalHelper");
const { convertJsonToExcelCommon } = require("../../../../../../utils/json_to_excel");
const indexRepository = require('../../../repositories/index');

const exportSalesInfo = async (condition) => {

    let salesQuery = `Select * from getsalesexportdata(`;
    salesQuery += (condition.entity_type !== null) ? `'${condition.entity_type}',` : `${condition.entity_type},`;
    salesQuery += (condition.company_id !== null) ? `'${condition.company_id}',` : `${condition.company_id},`;
    salesQuery += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date})`;
    excelData = await indexRepository.rawQuery(salesQuery);

    if (excelData && excelData.length > 0) {
        await Promise.all(
            excelData.map(async obj => {
                await Promise.all(Object.entries(obj).map(async ([key, value]) => {
                    if (value) {
                        if (key == 'employee_name' || key == 'employee_id' || key == 'timesheet_id') {
                            obj[key] = (obj[key] && obj[key].length) ? obj[key].join(',') : null;
                        }
                    }
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

        var workbookName = { name1: condition.entity_type };
        const sheet_name = await toTitleCase(condition.entity_type);
        const excelfile = await convertJsonToExcelCommon(excelData, sheet_name, [], workbookName);
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return excelData;
    }
}

const exportLedgersInfo = async (condition) => {

    let ledgersQuery = `Select * from getledgersexportdata(`;
    ledgersQuery += (condition.entity_type !== null) ? `'${condition.entity_type}',` : `${condition.entity_type},`;
    ledgersQuery += (condition.company_id !== null) ? `'${condition.company_id}',` : `${condition.company_id},`;
    ledgersQuery += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date})`;
    excelData = await indexRepository.rawQuery(ledgersQuery);

    if (excelData && excelData.length > 0) {
        await Promise.all(
            excelData.map(async obj => {
                await Promise.all(Object.entries(obj).map(async ([key, value]) => {
                    if (value) {
                        if (key == 'employee_name' || key == 'employee_id' || key == 'timesheet_id') {
                            obj[key] = (obj[key] && obj[key].length) ? obj[key].join(',') : null;
                        }
                    }
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

        var workbookName = { name1: condition.entity_type };
        const sheet_name = await toTitleCase(condition.entity_type);
        const excelfile = await convertJsonToExcelCommon(excelData, sheet_name, [], workbookName);
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return excelData;
    }
}

module.exports = { exportSalesInfo, exportLedgersInfo }