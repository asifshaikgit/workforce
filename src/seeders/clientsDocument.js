// Clients Default Documents
const  clientsDocumentData = [
  {
    document_category_id: 2, // Client Documents
    name: 'PO',
    description: 'PO',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by: null,
  },
];

const clientsDocumentDataSeed = async (tenant) => {
  await tenant('document_types').insert(clientsDocumentData);
};
module.exports = clientsDocumentDataSeed;
