const { responseMessages } = require('../../../../../constants/responseMessage')
const { getConnection } = require('../../../../middlewares/connectionManager')

/**
 * Function to get the records where the user is approver
 * 
 * this function will check for all the approval_Settings the user is assigned and 
 * will return the count of approvals in the level where he is approver
 * based on the result we will check if he is the only approver then will not allow his id to be deactivated
 * 
 */
const findCountofApprovals = async (approverId) => {
	const db = await getConnection();
	const userApproverQuery = await db('approval_levels AS al')
		.leftJoin('approval_users AS au', function () {
			this.on('al.id', '=', 'au.approval_level_id')
				.andOn(db.raw('au.approver_id = ?', [approverId]))
				.andOnNull('au.deleted_at');
		})
		.leftJoin(function () {
			this.from('approval_users AS sub_au')
				.whereNull('sub_au.deleted_at')
				.groupBy('sub_au.approval_level_id')
				.select('sub_au.approval_level_id')
				.count('*')
				.as('num_approval_users');
		}, 'al.id', '=', 'num_approval_users.approval_level_id')
		.leftJoin('approval_settings', 'approval_settings.id', '=', 'al.approval_setting_id')
		.leftJoin('placements as plt', 'approval_settings.id', '=', 'plt.timesheet_approval_id')
		.leftJoin('placements as pli', 'approval_settings.id', '=', 'pli.invoice_approval_id')
		.leftJoin('companies as ct', 'approval_settings.id', '=', 'ct.timesheet_approval_id')
		.leftJoin('companies as ci', 'approval_settings.id', '=', 'ci.invoice_approval_id')
		.select('al.approval_setting_id', 'al.level', 'au.id AS approval_user_id', 'au.approver_id', 'ct.reference_id as client_timesheet', 'ci.reference_id as client_invoice', 'plt.reference_id as placement_timesheet', 'pli.reference_id as placement_invoice')
		.select(db.raw('COALESCE(num_approval_users.count, 0) AS num_approval_users'))
		.select(db.raw('CASE WHEN au.approver_id = ? THEN true ELSE false END AS is_approver', [approverId]))
		.whereNull('al.deleted_at')
		.groupBy('al.approval_setting_id', 'al.level', 'au.id', 'au.approver_id', 'num_approval_users.count', 'ct.id', 'ci.id', 'plt.id', 'pli.id')
		.having(db.raw('CASE WHEN au.approver_id = ? THEN true ELSE false END = ?', [approverId, true]));

	if (userApproverQuery.length > 0) {
		return { status: true, data: userApproverQuery }
	} else {
		return {
			status: false,
			data: [],
			message: responseMessages.common.noRecordFound,
			error: ''
		}
	}
}

module.exports = { findCountofApprovals }