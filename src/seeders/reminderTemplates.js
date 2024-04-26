// On Hold
const reminderTemplatesData = [
  {
    reminder_name_id: 1,
    content: '{{timesheet_number}} for {{display_name}} with {{employee_id}} working with {{client_name}} is pending for approval. Take Action.',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 2,
    content: '{{timesheet_number}} for {{display_name}} with {{employee_id}} working with {{client_name}} is pending for submission. Please send a reminder.',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 3,
    content: '{{invoice_number}} for {{client_name}} on {{invoice_date}} with due date of {{due_date}} is pending for approval. ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 4,
    content: '{{invoice_number}} for {{client_name}} on {{invoice_date}} with due date of {{due_date}} has been drafted. Please send for approval.',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 5,
    content: '{{invoice_number}} for {{client_name}} on {{invoice_date}} with due date of {{due_date}} is overdue.  ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 6,
    content: '{{expense_id}} has been created for {{employee_name}} with {{employee_id}} with expense date of {{expense_date}}. Please take action. ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 7,
    content: ' {{employee_name}} has submitted all the documents through OCR onboarding. Please re-verify and take action. ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 8,
    content: ' {{employee_name}} has submitted all the documents through OCR onboarding. Please re-verify and take action. ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 9,
    content: '{{employee_name}} has submitted all the documents. Please complete E-verify to add placement. ',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 10,
    content: '{{employee_name}} has submitted personal documents. Please verify the documents and take action.',
    status : true,
    created_at: new Date(),
  },
  {
    reminder_name_id: 11,
    content: 'Payroll with {{payroll_cycle}} has been generated with {{check_date}} as check date. ',
    status : true,
    created_at: new Date(),
  }
];

const reminderTemplatesSeed = async (tenant) => {
  await tenant('reminder_referrables').insert(reminderTemplatesData);
};

module.exports = reminderTemplatesSeed;