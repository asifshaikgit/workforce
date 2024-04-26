require('dotenv').config()
const exportRepository = require('../../../repositories/export/exportRepository')
const { convertJsonToExcelEmployee, convertJsonToExcel } = require('../../../../../../utils/json_to_excel')
const moment = require('moment');
const indexRepository = require("../../../repositories/index");
const { toTitleCase } = require('../../../../../../helpers/globalHelper');

/**
 * Funtion used to find the all data with the condition by calling repository function.
 * @param {object} body
 * @param {object} filters
 * @return {object}
 */
const employeeInfo = async (body, filters, dateFormat) => {
    Employees = []
    serialNo = 1
    var columns = []
    var selectedColumns = []
    let condition = []
    const data = body.data
    const tableName = body.table_name
    for (i = 0; i < data.length; i++) {
        if (data[i].status == true) {
            /*reading label names for excel headers */
            columns.push(data[i].label_name)
            /* if join_cloumn variable there in object then need be join the tables */
            if (data[i].join_column) {
                /*if joining same tables then adding alias to for the table names*/
                if (tableName == data[i].primary_table && data[i].primary_table == data[i].related_table) {
                    joincondition = {
                        related_table: data[i].related_table + ' AS ' + i,
                        primary_table: data[i].primary_table + '.' + data[i].primary_table_column,
                        related_column: i + '.' + data[i].join_column,
                        is_deleted: i + '.deleted_at'
                    }
                    selectedColumns.push(i + '.' + data[i].field_name + ' as ' + data[i].label_name)
                } else {
                    joincondition = {
                        related_table: data[i].related_table,
                        primary_table: data[i].primary_table + '.' + data[i].primary_table_column,
                        related_column: data[i].related_table + '.' + data[i].join_column,
                        is_deleted: data[i].related_table + '.deleted_at'
                    }
                    selectedColumns.push(data[i].related_table + '.' + data[i].field_name + ' as ' + data[i].label_name)
                }
                /* if object contain main_table variable then need to be join parent table first its means */
                if (data[i].main_table) {
                    mainCondition = {
                        related_table: data[i].primary_table,
                        primary_table: data[i].main_table + '.' + data[i].main_column,
                        related_column: data[i].primary_table + '.' + data[i].primary_table_main_column,
                        is_deleted: data[i].primary_table + '.deleted_at'
                    }
                    /* checking condition[] array contain same object of mainCondition, 
                    if there no need to push the mainCondition object into condition[] array 
                    */
                    let isDuplicate = false
                    for (let j = 0; j < condition.length; j++) {
                        if (
                            condition[j].related_table === mainCondition.related_table &&
                            condition[j].primary_table === mainCondition.primary_table &&
                            condition[j].related_column === mainCondition.related_column
                        ) {
                            isDuplicate = true
                            break
                        }
                    }
                    if (!isDuplicate) {
                        condition.push(mainCondition)
                    }
                }
                /* checking condition[] array contain same object of joincondition, 
                   if there no need to push the joincondition object into condition[] array 
                */
                let isDuplicate = false
                for (let j = 0; j < condition.length; j++) {
                    if (
                        condition[j].related_table === joincondition.related_table &&
                        condition[j].primary_table === joincondition.primary_table &&
                        condition[j].related_column === joincondition.related_column
                    ) {
                        isDuplicate = true
                        break
                    }
                }
                if (!isDuplicate) {
                    condition.push(joincondition)
                }
            } else {
                selectedColumns.push(data[i].related_table + '.' + data[i].field_name + ' as ' + data[i].label_name)
            }
        }
    }
    const employeeData = await exportRepository.employeeFind(selectedColumns, condition, tableName, filters)

    if (employeeData.data != 0) {
        var employee = employeeData.data
        for (let key in employee) {
            listingObject = { SNo: serialNo }
            for (let index in columns) {
                if (columns[index].toLowerCase().includes('date of birth') || columns[index].toLowerCase().includes('hire date') || columns[index].toLowerCase().includes('dependent dob') || columns[index].toLowerCase().includes('start date') || columns[index].toLowerCase().includes('end date') || columns[index].toLowerCase().includes('certified date') || columns[index].toLowerCase().includes('valid from') || columns[index].toLowerCase().includes('valid till')) {
                    listingObject[columns[index]] = employee[key][columns[index]] ? moment(employee[key][columns[index]]).format(dateFormat) : ''
                } else {
                    listingObject[columns[index]] = employee[key][columns[index]] ? employee[key][columns[index]] : ''
                }
            }
            Employees.push(listingObject)
            serialNo++
        }
        var fileName = body.name.replace(" ", "_");
        var excelfile = await convertJsonToExcelEmployee(Employees, fileName)
        return { status: true, filepath: excelfile }
    } else {
        return false
    }
}

/**
 * Function Used to fetch the exployee profile activity track.
 * @param {*} body 
 */
const exportEmployeeActivityInfo = async (body) => {

    const fields = ['emp.display_name as Employee Name', 'employee_profile_activity_track.created_at as Created at', 'employeer.display_name as Employeer Name', 'employee_profile_activity_track.activity as Change'];
    const joins = [
        {
            table: 'employee as emp',
            alias: 'emp',
            condition: ['employee_profile_activity_track.employee_id', 'emp.id'],
            type: 'left'
        },
        {
            table: 'employee as employeer',
            alias: 'employeer',
            condition: ['employee_profile_activity_track.employee_id', 'employeer.id'],
            type: 'left'
        }
    ];
    let excelData = await indexRepository.find('employee_profile_activity_track', fields, { employee_id: body.employee_id }, null, joins);
    excelData = excelData.data

    if (excelData && excelData.length > 0) {
        let excelInfo = {};
        excelInfo =
            [
                {
                    'excelData': excelData,
                    'filename': 'Employee Activity Track'
                }
            ];
        const excelfile = await convertJsonToExcel(excelInfo, 'Employee Activity Track');
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return excelData;
    }
}

module.exports = { employeeInfo, exportEmployeeActivityInfo }