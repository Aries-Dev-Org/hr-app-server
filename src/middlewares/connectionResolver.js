const { createNamespace } = require('continuation-local-storage');

const {
  getConnectionByTenant,
  getAdminConnection,
} = require('../db/connectionManager');
const getTenant = require('../helpers/getTennant');

// Create a namespace for the application.
const nameSpace = createNamespace('unique context');

/**
 * Get the connection instance for the given tenant's name and set it to the current context.
 */
const resolveTenant = (req, res, next) => {
  const tenant = getTenant(req);

  if (!tenant) {
    return res.status(500).json({ message: 'Cliente no registrado.' });
  }

  req.tenant = tenant;

  // Run the application in the defined namespace. It will contextualize every underlying function calls.
  nameSpace.run(() => {
    const tenantDbConnection = getConnectionByTenant(tenant);

    if (!tenantDbConnection) {
      return res.status(500).json({
        error: `Cannot establish connection to tenant ${tenant}'s database`,
      });
    }
    nameSpace.set('connection', tenantDbConnection);
    next();
  });
};

/**
 * Get the admin db connection instance and set it to the current context.
 */
const setAdminDb = (req, res, next) => {
  // Run the application in the defined namespace. It will contextualize every underlying function calls.
  nameSpace.run(() => {
    const adminDbConnection = getAdminConnection();
    nameSpace.set('connection', adminDbConnection);
    next();
  });
};

module.exports = { resolveTenant, setAdminDb };
