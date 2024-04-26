const indexRepository = require("../../repositories/index")

const chatMessagesListing = async (condition, page, limit) => {

    // Get employees Self Service chat message
    const chatMessagesListing = await indexRepository.rawQuery(`Select * from GetEmployeeSelfServiceChatMessages('${condition.id}', ${limit}, ${page})`);
    let chatMessagesCount = await indexRepository.rawQuery(`select Count(*) from employee_self_service_chat_messages where employee_self_service_id = '${condition.id}'`);
    chatMessagesCount = chatMessagesCount[0]?.count

    pagination_details = {
        total: Number(chatMessagesCount),
        currentPage: Number(page),
        perPage: Number(limit),
        totalPages: Math.ceil(chatMessagesCount / limit)
    }

    if (chatMessagesListing.length > 0) {
        return {
            status: true,
            data: chatMessagesListing,
            pagination_data: pagination_details
        }
    } else {
        return chatMessagesListing;
    }
};

module.exports = { chatMessagesListing }