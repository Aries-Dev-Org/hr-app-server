const { createNamespace } = require('continuation-local-storage');

const {
  getConnectionByTenant,
  getAdminConnection,
} = require('../db/connectionManager');

// Create a namespace for the application.
const nameSpace = createNamespace('unique context');

/**
 * Get the connection instance for the given tenant's name and set it to the current context.
 */
const resolveTenant = (req, res, next) => {
  // Aquí se resuelve a que base de datos pegarle

  // Se toma el subdominio de la url origin
  const origin = req.get('Origin');
  const originMatch = origin?.match(/\/\/([^.]+)\./);
  const subDomain = originMatch ? originMatch[1] : null;

  // Finalmente se evalúa si se envía el tenant por headers (el caso de peticiones por postman)
  // Sino se toma el subdominio (el caso de peticiones desde el frontend)
  // Si no se encontraron ninguno de los 2 datos, simplemente se setea en null para que luego finalice con un error
  const tenant = req.headers.tenant || subDomain || null;

  if (!tenant) {
    return res.status(500).json({ message: 'Cliente no registrado.' });
  }

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
