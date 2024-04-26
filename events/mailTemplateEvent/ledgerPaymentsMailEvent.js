const eventsEmitter = require('events');
const mailEvents = new eventsEmitter();
const { getEmailTemplate } = require('../../helpers/emailTemplate');
const { sendMail } = require('../../utils/emailSend');
const indexRepository = require('../../src/v1/user/repositories/index');
const format = require('../../helpers/format');
const moment = require('moment')

mailEvents.on('ledgerPaymentsMail', async (body,ledgersPaymentData) => {
    try {
        
        var slug;
        var replaceObj;
        let dateFormat = await format.getDateFormat(); // date format
        var ledger_payment_id = ledgersPaymentData.data[0].id

        var signature = await indexRepository.find('organization', ['organization_name', 'email_signature']);

        var fields = [ 'raised_emp.display_name as raised_emp' ,'c.name as client_name' ,'c.email_id as client_email_id' , 'ca.zip_code' , 'ca.city' , 'ca.address_line_two', 'ca.address_line_one' , 'cut.name as country_name' , 'st.name as state_name', 'ledgers.amount as total_amount_payable', 'lp.reference_id', 'lp.received_on as payment_date', 'lp.total_received_amount', 'ledgers.balance_amount' , 'pm.name as payment_mode' ]
        var joins = [
            { table: 'companies as c', alias: 'plc', condition: ['c.id', 'ledgers.company_id'] , type: 'left'},
            { table: 'company_address as ca', alias: 'ca', condition: ['ca.company_id', 'c.id'] , type: 'left'},
            { table: 'ledger_payment_section_details as lpsd', alias: 'lpsd', condition: ['ledgers.id', 'lpsd.ledger_id'] , type: 'left'},
            { table: 'ledger_payments as lp', alias: 'lp', condition: ['lpsd.ledger_payment_id', 'lp.id'] , type: 'left'},
            { table: 'payment_modes as pm', alias: 'pm', condition: ['lp.payment_mode_id', 'pm.id'] , type: 'left'},
            { table: 'countries as cut', alias: 'cut', condition: ['ca.country_id', 'cut.id'] , type: 'left'},
            { table: 'states as st', alias: 'st', condition: ['ca.state_id', 'st.id'] , type: 'left'},
            { table: 'employee as raised_emp', alias: 'raised_emp', condition: ['ledgers.created_by', 'raised_emp.id'] , type: 'left'},
        ];

        var ledgerPaymentsData = await indexRepository.find('ledgers', fields , { 'ledger_payments.id': ledger_payment_id , 'ca.address_type' : 1, 'ca.is_default' : true}, null, joins);
        ledgerPaymentsData = ledgerPaymentsData?.data[0]

        if(body.entity_type == 'payment') {  // invoice-payments
            slug = 'payment-received'
            replaceObj = {
                '{{bill_reference_id}}': ledgerPaymentsData.reference_id,
                '{{bill_date}}': moment(ledgerPaymentsData.payment_date , dateFormat).format('DD-MM-YYYY') ,
                '{{total_amount}}': ledgerPaymentsData.total_amount_payable,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name ,
            };
        } else if (body.entity_type == 'bill-payment') {
            slug = 'bill-payment'
            replaceObj = {
                '{{invoice_number}}': ledgerPaymentsData.reference_id,
                '{{balance_amount}}': ledgerPaymentsData.balance_amount,
                '{{payment_mode}}': ledgerPaymentsData.payment_mode,
                '{{payment_date}}': moment(ledgerPaymentsData.payment_date , dateFormat).format('DD-MM-YYYY') ,
                '{{total_amount_payable}}': ledgerPaymentsData.total_amount_payable,
                '{{payment_amount}}': ledgerPaymentsData.total_received_amount,
                '{{client_name}}': ledgerPaymentsData.client_name,
                '{{client_address_pincode}}': ledgerPaymentsData.zip_code,
                '{{client_address_country}}': ledgerPaymentsData.country_name,
                '{{client_address_state}}': ledgerPaymentsData.state_name,
                '{{client_address_city}}': ledgerPaymentsData.city,
                '{{client_address_one}}': ledgerPaymentsData.address_line_one,
                '{{client_address_two}}': ledgerPaymentsData.address_line_two,
                '{{organization_signature}}': signature.status ? (signature.data[0].email_signature? signature.data[0].email_signature : 'Thanks & Regards') : 'Thanks & Regards',
                '{{organization_name}}': signature.data[0].organization_name ,
            };
        }        

        const templateData = await getEmailTemplate(replaceObj, slug);

        var emailData;

        if(body.entity_type = 'bill-payment'){
            var ledgerPaymentsData = await indexRepository.find('ledgers', ['raised_emp.display_name as raised_emp', 'raised_emp.email_id'] , { 'ledger_payments.id': ledger_payment_id , 'ledgers.entity_type' : 'bill'  ,  'ca.address_type' : 1, 'ca.is_default' : true}, null, joins);
            ledgerPaymentsData.data.forEach((paymentData) => {
                const emailData = {
                    toEmail: paymentData.email_id,
                    subject: templateData.subject,
                    html: templateData.template,
                };
                sendMail(emailData);
                console.log(`Email Sent Successfully to ${paymentData.email_id}`);
            });
        } else if(body.entity_type == 'payment') {
            emailData = {
                toEmail: ledgerPaymentsData.data[0].client_email_id,
                subject: templateData.subject,
                html: templateData.template,
            };
            sendMail(emailData);
            console.log(`Email Sent Successfully to ${ledgerPaymentsData.data[0].client_email_id}`);
        }
    } catch (err) {
        console.log(err);
    }

});

module.exports = { mailEvents };