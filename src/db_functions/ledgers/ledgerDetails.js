const getLedgerDetails = async (tenantDb) => {
    try {
        await tenantDb.raw(`
        DROP FUNCTION IF EXISTS GetLedgerDetails(
            ledger_id_filter UUID,
            entity_type_filter TEXT,
            date_format TEXT
        );
        CREATE OR REPLACE FUNCTION GetLedgerDetails(
                ledger_id_filter UUID,
                entity_type_filter TEXT,
                date_format TEXT
            )
            RETURNS TABLE (
                id UUID,
                reference_id VARCHAR(20),
                date TEXT,
                due_date TEXT,
                sub_total_amount DOUBLE PRECISION,
                total_amount DOUBLE PRECISION,
                balance_amount DOUBLE PRECISION,
                customer_note TEXT,
                status TEXT,
                order_number VARCHAR(30),
                discount_type INTEGER,
                discount_value DOUBLE PRECISION,
                discount_amount DOUBLE PRECISION,
                mark_as_sent BOOLEAN,
                void BOOLEAN,
                enable_recurring BOOLEAN,
                company_id UUID,
                company_reference_id VARCHAR,
                name VARCHAR(100),
                logo_document_url VARCHAR(255),
                days INTEGER,
                net_pay_terms_id INTEGER,
                terms_and_conditions TEXT,
                adjustment_amount DOUBLE PRECISION,
                documents JSONB,
                billing_address JSONB,
                shipping_address JSONB,
                ledger_item_details JSONB,
                received_amount_previous JSONB
            ) AS $$
            BEGIN
            RETURN QUERY
            SELECT
                ld.id,
		        ld.reference_id,
                TO_CHAR(ld.date, date_format) as date,
                TO_CHAR(ld.due_date, date_format) as due_date,
		        ld.sub_total_amount,
		        ld.amount,
		        ld.balance_amount,
		        ld.customer_note,
                ld.status,
                ld.order_number,
                ld.discount_type,
                COALESCE(ld.discount_value, 0),
                COALESCE(ld.discount_amount, 0),
                ld.is_sent,
                ld.is_void,
                ld.enable_recurring,
                cmpny.id,
                cmpny.reference_id,
		        cmpny.name,
		        cmpny.logo_document_url,
		        npt.days,
                ld.net_pay_terms_id,
                ld.terms_and_conditions,
                COALESCE(ld.adjustment_amount, 0),
                jsonb_agg(DISTINCT jsonb_build_object('id',ldoc.id, 'ledger_id' , ldoc.ledger_id, 'document_name', ldoc.document_name, 'document_url', ldoc.document_url)) as documents,
                jsonb_agg(DISTINCT jsonb_build_object('id',ld_add_billing.id, 'company_name', cmpny.name,  'city',ld_add_billing.city,'state_id',ld_add_billing.state_id,'zip_code',ld_add_billing.zip_code,'country_id',ld_add_billing.country_id,'address_type',ld_add_billing.address_type, 'address_line_one', ld_add_billing.address_line_one, 'address_line_two', ld_add_billing.address_line_two, 'state_name', state_bill.name, 'country_name', country_bill.name)) as billing_address,
                jsonb_agg(DISTINCT jsonb_build_object('id',ld_add_shipping.id, 'company_name', cmpny.name,  'city',ld_add_shipping.city,'state_id',ld_add_shipping.state_id,'zip_code',ld_add_shipping.zip_code,'country_id',ld_add_shipping.country_id,'address_type',ld_add_shipping.address_type, 'address_line_one', ld_add_shipping.address_line_one, 'address_line_two', ld_add_shipping.address_line_two, 'state_name', state_ship.name, 'country_name', country_ship.name)) as shipping_address,
                jsonb_agg(DISTINCT jsonb_build_object('id',lid.id, 'placement_id',lid.placement_id, 'description', lid.description, 'service_name', lid.service_name, 'hours', lid.hours, 'rate', lid.rate, 'amount', lid.amount, 'employee_id' , lid.employee_id, 'employee_name' , emp.display_name, 'profile_picture_url', emp.profile_picture_url, 'gender', emp.gender, 'employee_reference_id', emp.reference_id, 'timesheets_available',         
                CASE
                    WHEN lid.timesheets_available IS NULL THEN false
                    ELSE lid.timesheets_available
                END, 
                'timesheet_hour_ids', lid.timesheet_hour_ids)) as ledger_item_Details,
                jsonb_object_agg(COALESCE(lpsd.id, 0), lpsd.received_amount) as total_received_amount
                from ledgers as ld
                LEFT JOIN companies as cmpny on ld.company_id = cmpny.id                                          
                LEFT JOIN ledger_addresses as ld_add_billing on ld.id = ld_add_billing.ledger_id AND ld_add_billing.address_type = 2
                LEFT JOIN ledger_addresses as ld_add_shipping on ld.id = ld_add_shipping.ledger_id AND ld_add_shipping.address_type = 1
                LEFT JOIN ledger_item_details as lid on ld.id = lid.ledger_id
                LEFT JOIN employee as emp on lid.employee_id = emp.id
                LEFT JOIN net_pay_terms as npt on ld.net_pay_terms_id = npt.id
                LEFT JOIN ledger_documents as ldoc on ld.id = ldoc.ledger_id
                LEFT JOIN states as state_bill on ld_add_billing.state_id = state_bill.id
                LEFT JOIN countries as country_bill on ld_add_billing.country_id = country_bill.id
                LEFT JOIN states as state_ship on ld_add_shipping.state_id = state_ship.id
                LEFT JOIN countries as country_ship on ld_add_shipping.country_id = country_ship.id
                LEFT JOIN ledger_payment_section_details as lpsd on ld.id = lpsd.ledger_id
                where 
                ld.id = ledger_id_filter
                AND ld.entity_type = entity_type_filter
                GROUP BY ld.id, cmpny.id, cmpny.name, cmpny.logo_document_url, npt.days, ld.customer_note;
                END;
                $$ LANGUAGE plpgsql;`
        )
    } catch (e) {
        console.log(e.message);
    }
}

module.exports = getLedgerDetails;