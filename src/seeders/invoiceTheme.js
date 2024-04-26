// Invoice themes type defult insertion
const invoiceThemesData = [
  {
    id: 1,
    theme_name: 'theme1',
        
  },
  {
    id: 2,
    theme_name: 'theme2',
  },
  {
    id: 3,
    theme_name: 'theme3',
  },
  {
    id: 4,
    theme_name: 'theme4',
  },
  {
    id: 5,
    theme_name: 'theme5',
  },
  {
    id: 6,
    theme_name: 'theme6',
  },
  {
    id: 7,
    theme_name: 'theme7',
  }, 
  {
    id: 8,
    theme_name: 'theme8',
  },
  {
    id: 9,
    theme_name: 'invoice',
  }
];

const invoiceThemesDataSeed = async (tenant) => {
  // await tenant('invoice_themes').insert(invoiceThemesData);
};

module.exports = invoiceThemesDataSeed;