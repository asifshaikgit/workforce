const getEmployeeSelfServiceChatMessages = async (tenantDb) => {
    try {
        await tenantDb.raw(`
            DROP FUNCTION IF EXISTS getEmployeeSelfServiceChatMessages(
                self_service_id_filer UUID,
                page_size INT,
                page_number INT
                );
            CREATE OR REPLACE FUNCTION getEmployeeSelfServiceChatMessages(
                self_service_id_filer UUID,
                page_size INT,
                page_number INT
                )
                RETURNS TABLE (
                    id INT,
                    --room_id UUID,
                    self_service_id UUID,
                    employee_id UUID,
                    message TEXT,
                    is_read BOOLEAN,
                    attachemnt_url TEXT,
                    created_at TIMESTAMPTZ,
                    display_name VARCHAR(250)
                ) AS $$
                BEGIN
                RETURN QUERY
                Select 
                ess_chat_messages.*, 
                e.display_name 
                from employee_self_service_chat_messages as ess_chat_messages
                left join employee as e on ess_chat_messages.employee_id = e.id 
                where ess_chat_messages.employee_self_Service_id = self_service_id_filer
                order by ess_chat_messages.created_at desc
                LIMIT 
                page_size
                OFFSET 
                (page_number - 1) * page_size;
                END;
                $$ LANGUAGE plpgsql;`
        )
    }  catch (e) {
        console.log(e.message);
    }
};

module.exports = getEmployeeSelfServiceChatMessages;