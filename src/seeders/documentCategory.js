// Fixed document categories. Now alloed to edit or add
const categoryData = [
  {
    name: 'Placement',
    slug: 'placement-documents',
    description : 'Placement created related documents category',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },

  {
    name: 'Client',
    slug: 'client-documents',
    description : 'Client onboarding related document category',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },

  {
    name: 'End Client',
    slug: 'end-documents',
    description : 'End client onboarding related document category',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },

  {
    name: 'Employee',
    slug: 'employee-personal-documents',
    description : 'Employee personal documents related documents category',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },

  {
    name: 'Invoice',
    slug: 'raise-invoices-documents',
    description : 'Invoice raise related documents category',
    is_active: 1,
    is_editable: false,
    created_at: new Date(),
    created_by : null,
  },
];

const documentCategoryDataSeed = async (tenant) => {
  await tenant('document_categories').insert(categoryData); 
};
   
module.exports = documentCategoryDataSeed;
