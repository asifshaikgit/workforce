
const tenantRoutes = require('./src/v1/tenant/routes/index');
const userRoutes = require('./src/v1/user/routes/index');
const aiRoutes = require('./src/v1/user/routes/ai');
const exportRoutes = require('./src/v1/user/routes/export');
// const importRoutes = require('./src/v1/user/routes/import');
const swaggerRoutes = require('./src/v1/user/routes/swagger');

const allRoutes = [tenantRoutes, userRoutes, aiRoutes, swaggerRoutes, exportRoutes];

module.exports = allRoutes;
