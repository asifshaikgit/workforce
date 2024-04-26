const eventsEmitter = require('events');
const subStatusEvents = new eventsEmitter();
const { getEmailTemplate } = require('../helpers/emailTemplate');
const config = require('../config/app')
const { sendMail } = require('../utils/emailSend');
const indexRepository = require('../src/v1/user/repositories/index');
const moment = require('moment')
const format = require('../helpers/format');
const transactionRepository = require('../src/v1/user/repositories/transactionRepository');
const { getConnection } = require('../src/middlewares/connectionManager');


subStatusEvents.on('employeeSubStatus', async (condition) => {
    let trx;
    try {

        // Initialize a database transaction
        const db = await getConnection();
        trx = await db.transaction();

        let placementsCountQuery = `SELECT 
        COUNT(CASE WHEN plc.end_date < CURRENT_DATE THEN 1 ELSE NULL END) 
        AS ended_plc_count
        FROM placements plc
        INNER JOIN employee as emp on emp.id = plc.employee_id
        WHERE emp.id = '${condition.employee_id}'
        AND emp.status = 'Active'
        AND '${condition.end_date}' < CURRENT_DATE;`;
        var placementsCount = await indexRepository.rawQuery(placementsCountQuery);

        if(placementsCount.length == 0) {
            await transactionRepository.update(trx, 'employee' , {id : condition?.employee_id} , { sub_status: 'Marketing' });
        }

        // Commit the transaction
        await trx.commit();

    } catch (err) {
        console.log(err);
    }

});

module.exports = { subStatusEvents };