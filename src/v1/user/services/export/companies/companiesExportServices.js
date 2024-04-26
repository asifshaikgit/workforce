const { toTitleCase } = require("../../../../../../helpers/globalHelper");
const { convertJsonToExcelCommon } = require("../../../../../../utils/json_to_excel");
const indexRepository = require("../../../repositories/index");

const exportCompaniesInfo = async (condition) => {
    const status_filter = condition.status;
    let exportCompaniesQuery =
        `Select
    c.name as client_name,
	c.reference_id as client_id,
	c.status,
	(
		Select cc.email_id from company_contacts as cc where cc.company_id = c.id AND cc.deleted_at IS NULL order by cc.created_at ASC LIMIT 1
	) as contact_email_1,
	(
		Select cc.email_id from company_contacts as cc 
		JOIN (
			SELECT company_id, min(id) AS second_highest_id
			FROM company_contacts as cc
			where cc.company_id = c.id AND cc.deleted_at is NULL
			GROUP BY company_id
			) AS max_ids 
		ON cc.company_id = max_ids.company_id
		where cc.id > max_ids.second_highest_id 
	order by cc.created_at ASC LIMIT 1
	) as contact_email_2
	from companies as c
	where c.entity_type = '${condition.entity_type}'`;
    exportCompaniesQuery += (condition.status) ? `AND 
    (
        '${status_filter}' IS NOT NULL AND c.status = '${status_filter}'
    )` : ``;
    exportCompaniesQuery += `group by c.name, c,reference_id, c.status, c.id
	order By c.created_at ASC`;

    const companiesListing = await indexRepository.rawQuery(exportCompaniesQuery);

    for (const key in companiesListing[0]) {
        let oldKey = key;
        let tempValue = companiesListing[0][key];
        let newKey = await toTitleCase(key);
        companiesListing[0][newKey] = tempValue;
        delete companiesListing[0][oldKey];
    }

    if (companiesListing && companiesListing.length > 0) {

        var workbookName = { name1: condition.entity_type };
        const sheet_name = await toTitleCase(condition.entity_type);
        const excelfile = await convertJsonToExcelCommon(companiesListing, sheet_name, [], workbookName);
        return {
            status: true,
            filepath: excelfile
        };
    } else {
        return companiesListing;
    }
}

module.exports = { exportCompaniesInfo }