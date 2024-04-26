
const { getConnection } = require('../../../../middlewares/connectionManager');
const transactionRepository = require('../../repositories/transactionRepository');
const { event } = require('../../../../../events/expenseActivityEvent');
const indexRepository = require('../../repositories/index');
const commonDocumentStore = require('../../../../../helpers/commonDocumentStore');
const { generateEmployeeAvatar } = require('../../../../../helpers/globalHelper');
const format = require('../../../../../helpers/format');
const { mailEvents } = require('../../../../../events/mailTemplateEvent/expenseManagementMailEvent');
const e = require('express');

/**
 * Store function to add a new expense for an epolyee.
 * 
 * Logic:
 * - Call the 'indexRepository.store' function to add the 'expenses' to the 'expense_management' table.
 * - Return the response from the repository.
 * 
 * @param {Object} employee - The request body containing Expense Information.
 * @returns {Object} Repository response.
 */
const store = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        const count = await indexRepository.count('expense_management', [], [], false);

        var employment_type_id = await indexRepository.find('employee', ['id', 'employment_type_id'], { id: body.loginUserId });
        employment_type_id = employment_type_id.data[0].employment_type_id;

        // Generating the client refernce id based on prefixes
        const prefix = await indexRepository.find('prefixes', ['prefix_name', 'separator', 'number'], { slug: 'expense' });
        const prefixData = prefix.data[0];
        var reference_id = prefixData.prefix_name + prefixData.separator + (Number(count.data) + prefixData.number)

        // New Store Object
        const newExpense = {
            employee_id: body.employee_id,
            expense_type_id: body.expense_type_id,
            amount: body.amount,
            due_amount: body.amount,
            raised_date: body.raised_date,
            description: body?.description || null,
            expense_transaction_type: body.expense_transaction_type,
            expense_effect_on: body.expense_effect_on,
            enable_approval: body.enable_approval,
            has_goal_amount: body.expense_transaction_type == 2 ? (body.has_goal_amount != '' ? body.has_goal_amount : null) : null,
            goal_amount: body.expense_transaction_type == 2 ? (body.goal_amount ? body.goal_amount : 0) : null,
            is_recurring: body.expense_transaction_type == 1 ? (body.is_recurring != '' ? body.is_recurring : null) : null,
            recurring_count: body.expense_transaction_type == 1 ? (body.recurring_count ? body.recurring_count : null) : null,
            status: (body.enable_approval == true || body.enable_approval == 1) ? 'Approval In Progress' : 'Submitted',
            raised_by: employment_type_id,
            reference_id: reference_id,
            created_at: new Date(),
            created_by: body.created_by
        };

        // Store the expense
        const expense = await transactionRepository.store(trx, 'expense_management', newExpense);
        var employee = await indexRepository.find('employee', ['first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'balance_amount'], { id: body.employee_id });


        // Update expense documents
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id) {
                const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Expenses/${reference_id}`;

                var documentObject = {
                    expense_id: expense?.data[0]?.id,
                    created_by: body.created_by,
                    created_at: new Date()
                }

                var documentData = await transactionRepository.store(trx, 'expense_documents', documentObject);
                await commonDocumentStore(trx, 'expense_documents', destFolder, documents[key].new_document_id, documentData.data[0].id);
            }
        }

        let redirection;
        if (body.enable_approval == 1) {
            redirection = true;
        } else {
            redirection = false;

            if (Number(body.expense_transaction_type) == 1) { // Reimbusment
                if (Number(body.expense_effect_on) == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount ? employee.data[0].balance_amount : 0;
                    let newBalance = previousBalance + Number(body.amount);

                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { balance_amount: newBalance });

                    // Update expense balance info
                    let updateExpense = { due_amount: 0, status: 'Processed' };
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0].id }, updateExpense);
                }
            } else {                          //Deduction
                if (Number(body.expense_effect_on) == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount ? employee.data[0].balance_amount : 0;
                    let newBalance = previousBalance - Number(body.amount);

                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { balance_amount: newBalance });

                    let updateExpense = { due_amount: 0, status: 'Processed' }
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0].id }, updateExpense);
                }
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        const expense_id = expense.data[0].id

        // Emit an event to trigger sending a email
        mailEvents.emit('expenseManagementMail',body, expense_id);

        /** Store Activity track */
        activity = {
            expense_id: expense.data[0].id,
            action_type: 1, //1 for create 
            created_by: body.created_by
        };
        event.emit('expenseActivity', { activity });
        /** Store Activity track */

        return expense;

    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
}

/**
 * Destroy function to delete an expense of an employee.
 * 
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Create an object 'updateData' to set the 'deleted_at', 'updated_at', and 'updated_by' properties for soft deletion.
 * - Call 'transactionRepository.update' to update the 'expense_management' entry with the 'updateData'.
 * - Commit the transaction after successful deletion.
 * - Return the response from the database operation.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 * 
 * @param {Object} body - The request body containing the data for deletion.
 * @param {Object} condition - The condition to locate the entry to delete.
 * @returns {Object} Repository response.
 */
const destroy = async (body, condition) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()

        /* storing delete entry object */
        var updateData = {
            deleted_at: new Date(),
            updated_at: new Date(),
            updated_by: body.updated_by
        }
        /* storing delete entry object */

        var repositoryResponse = await transactionRepository.update(trx, 'expense_management', condition, updateData);

        await trx.commit();

        /** Delete Activity track */
        activity = {
            expense_id: condition.id,
            action_type: 3, //3 for delete 
            created_by: body.created_by
        };
        event.emit('expenseActivity', { activity });
        /** Delete Activity track */

        return repositoryResponse
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

/**
 * Listing Function to get expoense mangament dat
 * Login:
 * - Fetch the data from the 'expense_management' table using condition (param) by calling common findByOagination function.
 * - If data exists,
 *   + loop the data and push the object in to an array and add serial number to the object
 *   + Prepare the response
 *   + return the response with status as true
 * - Else
 *   + return the response with status as false
 * 
 * @param { object } condition - The conditions to filter the expense data management
 * @param { number } page - The page number of the results to retrieve.
 * @param { number } limit - The maximum number of results per page
 * @returns { object } - An object containing the retrieved expense management data, pagination details and status.
 */
const listing = async (condition, page, limit, dateFormat) => {

    let query = `SELECT * FROM getExpenseManagementListing(`;
    query += (condition.expense_type !== null) ? `'${condition.expense_type}',` : `${condition.expense_type},`;
    query += (condition.employment_type != null) ? `'${condition.employment_type}',` : `${condition.employment_type},`;
    query += (condition.status !== null) ? `'${condition.status}',` : `${condition.status},`;
    query += (condition.expense_transaction_type !== null) ? `'${condition.expense_transaction_type}',` : `${condition.expense_transaction_type},`;
    query += (condition.employee_id != null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.balance_sheet != null) ? `'${condition.balance_sheet}',` : `${condition.balance_sheet},`;
    query += (condition.search !== null) ? `'${condition.search}',` : `${condition.search},`;
    query += (condition.from_date && condition.to_date) ? `'${condition.from_date}', '${condition.to_date}',` : `${condition.from_date}, ${condition.to_date},`;
    query += `${limit}, ${page},`;
    query += `'${dateFormat}')`;

    const expenseManagementListing = await indexRepository.rawQuery(query);

    const employeeIdCondition = condition.employee_id ? `AND employee_id = '${condition.employee_id}'` : '';

    const reimbusmentQuery = `
        SELECT COUNT(*) AS reimbusment_newly_raised
        FROM expense_management
        WHERE deleted_at IS NULL AND expense_transaction_type = 1 AND amount = due_amount ${employeeIdCondition} AND status != 'Rejected'`;

    const deductionQuery = `
        SELECT COUNT(*) AS deduction_newly_raised
        FROM expense_management
        WHERE deleted_at IS NULL AND expense_transaction_type = 2 AND amount = due_amount ${employeeIdCondition} AND status != 'Rejected'`;

    const reimbusmentNewlyRaised = await indexRepository.rawQuery(reimbusmentQuery);
    const deductionNewlyRaised = await indexRepository.rawQuery(deductionQuery);

    var newly_raised_details = {
        newly_raised_reimbusment: parseInt(reimbusmentNewlyRaised[0].reimbusment_newly_raised),
        newly_raised_deduction: parseInt(deductionNewlyRaised[0].deduction_newly_raised)
    }

    if (expenseManagementListing.length > 0) {
        const total_expense_count = expenseManagementListing[0]?.total_expense_count;
        expenseManagementListing.map(async (expense) => {
            expense.profile_picture_url = (expense?.profile_picture_url) ? expense?.profile_picture_url : await generateEmployeeAvatar(expense);
            delete expense.total_expense_count;
        });


        pagination_details = {
            total: parseInt(total_expense_count),
            currentPage: page,
            perPage: limit,
            totalPages: Math.ceil(total_expense_count / limit)
        }

        return {
            status: true,
            data: expenseManagementListing,
            pagination_data: pagination_details,
            newly_raised_data: newly_raised_details
        }

    } else {
        return {
            status: false,
            data: expenseManagementListing,
            newly_raised_data: newly_raised_details
        }
    }
}

/**
 * Updates an expense record with the provided data and performs additional actions based on the updated data.
 * @param {Object} body - The data object containing the updated expense information.
 * @returns {Object} - An object containing the updated expense details, employee details, email template data, and redirection flag.
 * @throws {Error} - If any error occurs during the update process.
 */
const update = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /* Writing condition to the update entry */
        var condition = { id: body.expense_management_id };
        /* Writing condition to the update entry */

        /* Creating update entry object */
        const updateData = {
            employee_id: body.employee_id,
            expense_type_id: body.expense_type_id,
            raised_date: body.raised_date,
            amount: body.amount,
            due_amount: body.amount,
            description: body.description,
            expense_transaction_type: body.expense_transaction_type,
            expense_effect_on: body.expense_effect_on,
            enable_approval: body.enable_approval,
            has_goal_amount: body.expense_transaction_type == 2 ? (body.has_goal_amount != '' ? body.has_goal_amount : null) : null,
            goal_amount: body.expense_transaction_type == 2 ? (body.goal_amount ? body.goal_amount : 0) : null,
            is_recurring: body.expense_transaction_type == 1 ? (body.is_recurring != '' ? body.is_recurring : null) : null,
            recurring_count: body.expense_transaction_type == 1 ? (body.recurring_count ? body.recurring_count : null) : null,
            status: 'Submitted',
            updated_by: body.updated_by,
            updated_at: new Date()
        }
        /* Creating update entry object */

        /* get the fields that required activity tracking */
        const fields = Object.keys(updateData).slice(0, -2);
        /* get the fields that required activity tracking */

        /**Fetching company details before update */
        const beforeUpdateData = await indexRepository.find('expense_management', fields, condition);
        /**Fetching company details before update */

        var expense = await transactionRepository.update(trx, 'expense_management', condition, updateData); // Update the expense management
        var employee = await indexRepository.find('employee', ['first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'balance_amount'], { id: body.employee_id });


        // Update expense documents
        var documents = body.documents;
        for (const key in documents) {
            if (documents[key].new_document_id) {
                const destFolder = `${body.loginSubDomainName}/Employee/${body.employee_reference_id}/Expenses/${body.reference_id}`;

                if (documents[key].id) {

                    var documentObject = {
                        updated_by: body.updated_by,
                        updated_at: new Date()
                    }

                    var documentData = await transactionRepository.update(trx, 'expense_documents', { expense_id: expense?.data[0]?.id }, documentObject);
                    await commonDocumentStore(trx, 'expense_documents', destFolder, documents[key].new_document_id, documents[key].id);
                } else {
                    var documentObject = {
                        expense_id: expense?.data[0]?.id,
                        created_by: body.created_by,
                        created_at: new Date()
                    }

                    var documentData = await transactionRepository.store(trx, 'expense_documents', documentObject);
                    await commonDocumentStore(trx, 'expense_documents', destFolder, documents[key].new_document_id, documentData.data[0].id);
                }
            }
        }

        let redirection;
        if (body.enable_approval == 1) {
            redirection = true;
        } else {
            redirection = false;

            if (body.expense_transaction_type == 1) { //employee spend behalf of organization
                if (body.expense_effect_on == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount;
                    let newBalance = previousBalance + Number(body.amount);

                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { balance_amount: newBalance });

                    let updateExpense = { due_amount: 0, status: 'Processed' }
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0].id }, updateExpense);
                }
            } else {                          //organization spend
                if (body.expense_effect_on == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount;
                    let newBalance = previousBalance - Number(body.amount);
                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: body.employee_id }, { balance_amount: newBalance });

                    let updateExpense = { due_amount: 0, status: 'Processed' }
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0]?.id }, updateExpense);
                }
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        /** Update Activity track */
        activity = {
            expense_id: expense.data[0]?.id,
            action_type: 2, //2 for update 
            created_by: body.created_by,
            fields: fields,
            beforeUpdate: beforeUpdateData.data[0],
        };
        event.emit('expenseActivity', { activity });
        /** Update Activity track */

        return expense;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }

};

/**
 * Function to approve an expense and update related data.
 *
 * Logic:
 * - Initialize a database transaction using 'getConnection()' and 'transaction'.
 * - Define a condition to locate the expense entry to update.
 * - Create an object 'updateData' with properties to update the expense status and other relevant information.
 * - Update the expense record in the 'expense_management' table using 'transactionRepository.update'.
 * - Fetch the updated expense data from the 'expense_management' table.
 * - Fetch the employee data related to the expense entry.
 * 
 * - Check if the expense transaction type is for employee or organization spending.
 *   - If it's employee spending, update the employee's balance amount accordingly.
 *   - If it's organization spending, update the employee's balance amount.
 *   - Update the expense entry with a due amount of 0 and received status of 1.
 * 
 * - Commit the transaction after successfully updating all data.
 * - Perform activity tracking to log the expense approval event.
 * - Return the response with information about the updated expense record.
 * - Handle errors, rollback the transaction in case of an exception, and return an error response.
 *
 * @param {Object} body - The request body containing information about the expense approval.
 * @returns {Object} Repository response.
 */

const approveExpense = async (body) => {
    let trx;
    try {
        //databse connection
        const db = await getConnection();
        trx = await db.transaction()
        //databse connection

        /* Writing condition to the update entry */
        var condition = { id: body.id };
        /* Writing condition to the update entry */

        /* Creating update entry object */
        const updateData = {
            status: 'Approved',
            approved_date: body.approved_date,
            updated_by: body.updated_by,
            updated_at: new Date()
        }
        /* Creating update entry object */

        var expense = await transactionRepository.update(trx, 'expense_management', condition, updateData); // Update the expense management

        var expenseData = await indexRepository.find('expense_management', ['*'], condition)
        var employee = await indexRepository.find('employee', ['first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'balance_amount'], { id: expenseData.data[0].employee_id });


        // expense_done_by old column , expense_transaction_type new column 
        if (expenseData.data[0].expense_transaction_type == 1) { //employee spend behalf of organization
            if (expenseData.data[0].expense_effect_on == 1) {  // payroll
                //Nothing Happends here
            } else {    // balance sheet
                let previousBalance = employee.data[0].balance_amount;
                let newBalance = previousBalance + Number(expenseData.data[0].amount);

                // Update employee due amount
                await transactionRepository.update(trx, 'employee', { id: expenseData.data[0].employee_id }, { balance_amount: newBalance });

                let updateExpense = { due_amount: 0, status: 'Processed' }
                await transactionRepository.update(trx, 'expense_management', condition, updateExpense);
            }
        } else {                          //organization spend
            if (expenseData.data[0].expense_effect_on == 1) {  // payroll
                //Nothing Happends here
            } else {    // balance sheet
                let previousBalance = employee.data[0].balance_amount;
                let newBalance = previousBalance - Number(expenseData.data[0].amount);
                // Update employee due amount
                await transactionRepository.update(trx, 'employee', { id: expenseData.data[0].employee_id }, { balance_amount: newBalance });

                let updateExpense = { due_amount: 0, status: 'Processed' }
                await transactionRepository.update(trx, 'expense_management', { id: expense[0].id }, updateExpense);
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        /* Activity track update */
        // activity track variables obj
        // const activityDataObj = {
        //     expenseTypeName: body?.expense_type_name,
        //     expenseReferenceId: body?.expense_reference_id,
        //     employeDisplayName: body?.employee_display_name,
        //     employeeReferenceId: body?.employee_reference_id,
        //     created_by: body?.created_by
        // }
        // activity track variables obj
        // await activityTrack(expense, 2, activityDataObj);
        /**Activity track */

        return expense;
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }

};

/**
 * Updates the status of an expense management entry and logs the activity.
 *
 * @param {object} body - Contains the request body with status and other details.
 * @param {object} condition - Contains the condition to identify the specific entry to update.
 * @returns {object} - An object containing the status of the update process and potential error details.
 *
 * Logic:
 * - Constructs an object 'updateData' with the new status, updated_by, and updated_at.
 * - Retrieves fields that require activity tracking from 'updateData'.
 * - Fetches the expense details before the update ('beforeData') to track changes.
 * - Maps the status value to a human-readable form ('statusMap').
 * - Constructs 'beforeUpdateData' containing the status before the update.
 * - Executes the update operation on the 'expense_management' table using 'indexRepository.update'.
 * - Generates an activity object with details about the update (expense_id, action_type, created_by, fields, beforeUpdate).
 * - Emits an event ('expenseActivity') containing the activity details.
 * - Returns the result of the update operation.
 * - Handles potential errors and performs a rollback if needed.
 */
const updateStatus = async (body, condition) => {

    let trx;

    try {

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();
        // Initialize a database transaction

        var employee_id = await indexRepository.find('expense_management', ['employee_id'], condition);
        employee_id = employee_id.data[0].employee_id

        var employee = await indexRepository.find('employee', ['first_name', 'middle_name', 'last_name', 'display_name', 'email_id', 'balance_amount'], { id: employee_id });

        /* Creating update entry object */
        var updateData = {
            status: body.status,
            updated_by: body.updated_by,
            updated_at: new Date()
        };
        /* Creating update entry object */

        /* get the fields that required activity tracking */
        const fields = Object.keys(updateData).slice(0, -2);
        /* get the fields that required activity tracking */

        /**Fetching company details before update */
        const beforeData = await indexRepository.find('expense_management', fields, condition);
        const status = beforeData.data[0].status;
        const beforeUpdateData = { status: status };
        /**Fetching company details before update */

        var expense = await transactionRepository.update(trx, 'expense_management', condition, updateData);

        if (body.status == 'Approved') {
            if (expense.data[0].expense_transaction_type == 1) { //employee spend behalf of organization
                if (expense.data[0].expense_effect_on == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount;
                    let newBalance = previousBalance + expense.data[0].amount;

                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: employee_id }, { balance_amount: newBalance });

                    let updateExpense = { due_amount: 0, status: 'Processed' }
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0].id }, updateExpense);
                }
            } else {                          //organization spend
                if (expense.data[0].expense_effect_on == 1) {  // payroll
                    //Nothing Happends here
                } else {    // balance sheet
                    let previousBalance = employee.data[0].balance_amount;
                    let newBalance = previousBalance - expense.data[0].amount;
                    // Update employee due amount
                    await transactionRepository.update(trx, 'employee', { id: employee_id }, { balance_amount: newBalance });

                    let updateExpense = { due_amount: 0, status: 'Processed' }
                    await transactionRepository.update(trx, 'expense_management', { id: expense.data[0]?.id }, updateExpense);
                }
            }
        }

        // Commit the transaction
        await trx.commit();
        // Commit the transaction

        const expense_id = expense.data[0].id

        // Emit an event to trigger sending a email
        mailEvents.emit('expenseManagementMail',body, expense_id);

        /** Update Activity track */
        activity = {
            expense_id: expense.data[0]?.id,
            action_type: 2, //2 for update 
            created_by: body.created_by,
            fields: fields,
            beforeUpdate: beforeUpdateData,
        };
        event.emit('expenseActivity', { activity });
        /** Update Activity track */

        return expense
    } catch (error) {
        // Handle errors and rollback the transaction
        if (trx) {
            await trx.rollback();
        }
        return { status: false, error: error.message };
    }
};

async function getApproversCount(expense_type_id, employee_id, loginId) {
    const approversCountQuery = `
        SELECT CASE WHEN COUNT(ae.employee_id) > 0 THEN true ELSE false END AS has_employee_id
        FROM expense_and_service_types as est
        INNER JOIN assignee_employees as ae ON ae.referrable_id = est.id
        WHERE est.id = '${expense_type_id}'
        AND est.is_active = true
        AND ae.employee_id IN (
            SELECT ae.employee_id
            FROM assignee_employees
            WHERE ae.employee_id = '${loginId}'
        ) OR '${employee_id}' = '${loginId}' ;
    `;
    try {
        var approversCount = await indexRepository.rawQuery(approversCountQuery);
        return approversCount;
    } catch (err) {
        console.log(err);
    }
}

/**
 * Fetches expense management data based on the provided condition and date format.
 *
 * @param {object} condition - An object containing the condition for the query.
 * @param {string} dateFormat - The format of the date used in the query.
 * @returns {object} - An object with status indicating success or failure and data containing the retrieved expense management information.
 *
 * Logic:
 * - Constructs a SQL query using the 'getExpenseManagementIndex' stored procedure, incorporating the provided condition and date format.
 * - Executes the constructed query using 'indexRepository.rawQuery'.
 * - Handles the response and returns an object with status and retrieved data.
 */
const index = async (condition, limit, page, dateFormat) => {

    let query = `SELECT * FROM getExpenseManagementIndex(`;
    query += (condition.id != null) ? `'${condition.id}',` : `${condition.id},`;
    query += (condition.employment_type != null) ? `'${condition.employment_type}',` : `${condition.employment_type},`;
    query += (condition.employee_id != null) ? `'${condition.employee_id}',` : `${condition.employee_id},`;
    query += (condition.transaction_type_id != null) ? `'${condition.transaction_type_id}',` : `${condition.transaction_type_id},`;
    query += `'${condition.search}', ${limit}, ${page},`;
    query += `'${dateFormat}')`;

    // Get employees Lisitng using stored
    const expenseIndex = await indexRepository.rawQuery(query);

    var employmentType = await indexRepository.find('employee', ['employment_type_id'], { id: expenseIndex[0].employee_id });

    if (expenseIndex && expenseIndex.length > 0) {
        const count = expenseIndex[0]?.count;
        expenseIndex.map(expense => {
            delete expense.count;
        });

        employmentType = employmentType.data[0]

        if(employmentType.employment_type_id == 1 && expenseIndex[0].status != 'Processed' && expenseIndex[0].status != 'Approved' && expenseIndex[0].status != 'Rejected' && expenseIndex[0].check_box == true) { 
            var expense_type_id = expenseIndex[0].expense_type_id;
            var employee_id = expenseIndex[0].employee_id;
            var loginId = condition.loginId;
            var approversCount = await getApproversCount(expense_type_id, employee_id, loginId)
            expenseIndex[0].enable_approval = approversCount[0].has_employee_id;
        }

        pagination_details = {
            total: parseInt(count),
            currentPage: parseInt(page),
            perPage: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        }

        return {
            status: true,
            data: expenseIndex,
            pagination_data: pagination_details
        }
    } else {
        return expenseIndex;
    }

};

module.exports = { store, update, index, updateStatus, destroy, listing, approveExpense, getApproversCount };