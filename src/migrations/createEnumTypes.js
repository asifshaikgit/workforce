const createEnumTypes = async (tenant) => {

  // Status Types For -  `employee`, `companies`.
  await tenant.schema.raw(`
    CREATE TYPE status_types AS ENUM ('Active', 'In Active');
  `);

  // Ledger Status Types.
  await tenant.schema.raw(`
        CREATE TYPE ledger_status_types AS ENUM ();`);

  return;
}

module.exports = createEnumTypes;
