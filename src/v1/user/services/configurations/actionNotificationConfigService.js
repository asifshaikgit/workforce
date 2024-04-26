const indexRepository = require('../../repositories/index');

/**
 * Retrieves a listing of Action Notification Config
 * 
 * Logic:
 * 	- Set a query to get the action notifications.
 *  - Run the query to get the data of action notifications based on slug.
 *  - If data exits:
 *    + Create an empty array 'responseData'. 
 *  - If data doesn't exist, 
 *	  + Return the response object with status false, empty data.
 * 
 * @param {object} body 
 * @returns {Promise<object>} - A promise that resolves to the stored expense information.
 */
const listing = async (body) => {
	const actionNotificationQuery = `Select 
	anc.id, anc.slug, anc.name, anc.status, anc.created_at,
	jsonb_agg(json_build_object('id', grps.id, 'name', grps.name)) as groups
	from action_notification_config as anc
	LEFT JOIN groups as grps on grps.id = ANY(anc.group_ids)
	where referrable_type = '${body.slug}'
	group by anc.id`;

	// Default vaiables
	const listing = await indexRepository.rawQuery(actionNotificationQuery);
	if (listing) {
		return {
			status: true,
			data: listing
		}
	} else {
		return listing;
	}
}

const update = async (body) => {
	let trx;
	try {
		//databse connection
		const db = await getConnection();
		trx = await db.transaction();

		// get action notification before data
		const query = await getActionNotificationQuery(body.id);
		let beforeUpdate = await indexRepository.rawQuery(query);
		beforeUpdate = beforeUpdate[0];

		// Object for action notification update
		const updateObject = {
			group_ids: body.groups,
			content: body.content
		};

		const actionNotificationData = await transactionRepository.update(trx, 'action_notification_config', { id: body.id }, updateObject);

		await trx.commit();

		if (actionNotificationData?.status) {
			// initiate action notification activity track
			activity = {
				action_notification_config_id: body.id,
				action_type: 2, //2 for update
				created_by: body.created_by,
				beforeUpdate: beforeUpdate,
				query: query
			};
			events.emit('actionNotificationConfig', { activity });
		}

	} catch (error) {
		// Handle errors and rollback the transaction
		if (trx) {
			await trx.rollback();
		}
		return { status: false, error: error.message };
	}
}

module.exports = { listing, update }