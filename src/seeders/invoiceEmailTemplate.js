// Default Global invoice template
const invoiceEmailTemplateData = [
  {
    cc: {},
    bcc: {},
    subject: 'Invoice - {{invoice_number}} from {{company_name}}',
    template: `<p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> Dear {{client_name}}, </p>
    <br><br>
    <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> 
    Your invoice {{invoice_number}} can be view, printed or download as a PDF file from the link below.
    </p><br>
    <a href="{{invoice_url}}">Click to view Invoice </a>
    <br><br>
    <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> 
    Please do acknowledge the receipt of Invoice. I would like to request you to please co-operate with us by releasing payments at least 3 to 4 days before the due date.
    </p>
    <br><br>
    <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> 
    Thanks you for your business. We look forward to doing more business with you.
    </p>
    <br>
    <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> 
    Have a great day a head.
    </p>
    <br>
    <p style="font-size:11pt;font-family:Calibri,sans-serif;margin:0;"> 
    {{organization_signature}}
    </p>`,
    is_global: true,
    created_at: new Date(),
  },
  {
    cc: {},
    bcc: {},
    subject: 'Invoice - {{invoice_number}} from {{company_name}}',
    template: `<h1>Invoice {{invoice_number}} from {{organization_name}}</h1><p>Dear {{client_name}},</p><p>We hope you are doing well. We are writing to provide you with the details of the invoice issued for your recent transactions with {{organization_name}}. Please find the invoice information below:</p><strong>Invoice Information:</strong><ul><li><strong>Invoice Number:</strong> {{invoice_number}}</li><li><strong>Invoice Date:</strong> {{invoice_date}}</li><li><strong>Due Date:</strong> {{due_date}}</li> <li><strong>Invoice Amount:</strong> {{invoice_amount}}</li><li><strong>Total Amount:</strong> {{total_amount}}</li></ul><p>Your timely payment is greatly appreciated, as it plays a pivotal role in ensuring the seamless operation of our business. To facilitate the payment process, kindly refer to the instructions outlined in the invoice.</p><p>If you have any inquiries or require assistance with this bill, please do not hesitate to reach out to our dedicated support team. We are at your disposal to assist you.</p><p>We sincerely thank you for your prompt attention to this matter and your cooperation in promptly settling this outstanding invoice.</p><p>Best regards,</p><p>{{organization_signature}}</p>`,
    is_global: true,
    created_at: new Date(),
  },
];

const invoiceEmailTemplateSeed = async (tenant) => {
  await tenant('invoice_email_templates').insert(invoiceEmailTemplateData);
};

module.exports = invoiceEmailTemplateSeed;