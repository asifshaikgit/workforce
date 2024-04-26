const indexRepository = require("../../repositories/index");

const store = async (body) => {

    /* Creating new object */
    var newCompanyComment = {
        company_id: body.company_id,
        comment: body.comment,
        created_by: body.created_by,
        created_at: new Date()
    };
    /* Creating new object */

    var repositoryResponse = await indexRepository.store('companies_comments', newCompanyComment);
    return repositoryResponse;
};

const update = async (body, condition) => {
    /* Update object */
    var updateData = {
        company_id: body.company_id,
        comment: body.comment,
        // updated_by: body.updated_by,
        // updated_at: new Date(),
    };
    /* Update object */

    var repositoryResponse = await indexRepository.update('companies_comments',condition, updateData);
    return repositoryResponse
};

const index = async (condition) => {

    /* Query formation Conditions */
    let companyComments = await indexRepository.find('companies_comments', ['*'], condition); // Fetch Client comments
    if (companyComments.status) {

        /* Variables */
        var responseData = [];
        var total_details = companyComments.data;
        /* Variables */

        /* Using Map to iterate the loop and prepare the response */
        for(const key in total_details) {
            const listingObject = {
                id: total_details[key].id,
                company_id: total_details[key].company_id,
                comment: total_details[key].comment
            };
            responseData.push(listingObject)
        }
        /* Using Map to iterate the loop and prepare the response */

        return { status: true, data: responseData };
    } else {
        return companyComments;
    }
}

const listing = async (condition, page, limit) => {

    /* calling findByPagination method from  client comments Repository */
    var commentsData = await indexRepository.findByPagination('companies_comments', ['*'], condition, [], page, limit);

    if (commentsData.status) {

        /* Variables */
        var responseData = [];
        var total_details = commentsData.data;
        var pagination_details = commentsData.pagination;
        /* Variables */

        /**
         * Using Map to return the required response.
         */
        serial_no = (page - 1) * limit + 1;
        for(const key in total_details) {
            const listingObject = {
                serial_no: serial_no,
                id: total_details[key].id,
                company_id: total_details[key].company_id,
                comment: total_details[key].comment,
            };
            serial_no++;
            responseData.push(listingObject)
        }
        return { status: true, data: responseData, pagination_data: pagination_details };
    } else {
        return commentsData;
    }
};

module.exports = {index, listing, store, update };
