require('dotenv').config();

const color = {
  approved : process.env.APPROVED_COLOR ? process.env.APPROVED_COLOR : '#008000' ,
  rejected : process.env.REJECTED_COLOR ? process.env.REJECTED_COLOR : 'FF0000' ,
  invoiced : process.env.INVOICED_COLOR ? process.env.INVOICED_COLOR : '#FFD700' ,
  invoiced_pending : process.env.INVOICED_PENDING ? process.env.INVOICED_PENDING : '#FFCC00' ,
  draft : process.env.DRAFT_COLOR ? process.env.DRAFT_COLOR : '#D3D3D4',
  pending : process.env.PENDING_COLOR ? process.env.PENDING_COLOR : '#0000FF',
  paymentReceived : process.env.PAYMENT_RECEIVED_COLOR ?  process.env.PAYMENT_RECEIVED_COLOR : '#247BA1' ,
  overDue : process.env.OVER_DUE_COLOR ? process.env.OVER_DUE_COLOR : '#FFA500',
  emailSent : process.env.EMAIL_SENT_COLOR ? process.env.EMAIL_SENT_COLOR : "#00D7C6"
};

module.exports = { color };


