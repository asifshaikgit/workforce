const indexRepository = require('../v1/user/repositories/index');

// const handleLedgerHours = async (tenant) => {
//     const ledgerItemDetails = await tenant.table('ledger_item_details').select('id', 'hours');
//     ledgerItemDetails.map(async (item) => {

//         const hours = timeToPercentage(item.hours?.hours, item.hours?.minutes);
//         await tenant.table('ledger_item_details').where({ 'id': item.id }).update({ 'float_hours': hours })
//     });
// };

// function timeToPercentage(hours, minutes) {
//     var hours = (hours) ? parseInt(hours) : 0;
//     var minutes = (minutes) ? parseInt(minutes) : 0;

//     // Calculate total minutes
//     var totalMinutes = hours * 60 + minutes;

//     return parseFloat((totalMinutes / 60).toFixed(2));
// }

const handleLedgerHours = async (tenant) => {
    const ledgers = await tenant.table('ledgers').select('id', 'approved_status', 'payment_status');

    // APPROVED STATUS -> 0 - Drafted, 1 -Submit , 2 - Partiall Approved, 3- Approved, 4 - Rejected.
    // PAYMENT STATUS -> 0 - Not initiated, 1 - Partially Paid/Received, 2 - Fully Paid/Received'
    // NEW STATUS KEYS -> 'Draft', 'Approval In Progress', 'Approved', 'Rejected', 'Partially Paid', 'Paid', 'Void', 'Write Off', 'Submitted'
    ledgers.map(async (ledger) => {
        let new_status = '';
        if (ledger.approved_status == 0) {
            new_status = 'Drafted';
        } else if (ledger.approved_status == 1) {
            new_status = 'Submitted';
        } else if (ledger.approved_status == 2) {
            new_status = 'Approval In Progress';
        } else if (ledger.approved_status == 4) {
            new_status = 'Rejected';
        } else if (ledger.approved_status == 3) {
            new_status = 'Approved';
        } else if (ledger.approved_status == 3 && ledger.payment_status == 1) {
            new_status = 'Partially Paid';
        } else if (ledger.approved_status == 3 && ledger.payment_status == 2) {
            new_status = 'Paid';
        } else if (ledger.is_void == true && ledger.payment_status != 1) {
            new_status = 'Void';
        } else if (ledger.write_off_id && ledger.payment_status != 1) {
            new_status = 'Write Off';
        }

        await tenant.table('ledgers').where({ id: ledger.id }).update({ 'status': new_status })
            .then(() => {
                // Success
                console.log('success', ledger.id)
            }).catch((error) => {
                // Handle error
                console.log('error', error, ledger.id);
            })
    });
}

module.exports = handleLedgerHours