/* eslint-disable no-console */
require('dotenv').config();

const { getNamespace } = require('continuation-local-storage');

const { initAdminDbConnection } = require('./initAdminDbConnection');

const { initTenantDbConnection } = require('./initTenantDbConnection');

const tenantService = require('../services/tenantServices');

let connectionMap;
let adminDbConnection;

/**
 * Create knex instance for all the tenants defined in common database and store in a map.
 **/
const connectAllDb = async () => {
  console.log('Connecting all Dbs ...');
  let tenants;
  const ADMIN_DB_URI = `${process.env.BASE_DB_URI}/${process.env.ADMIN_DB_NAME}`;

  adminDbConnection = initAdminDbConnection(ADMIN_DB_URI);

  try {
    tenants = await tenantService.getAllTenants(adminDbConnection);
  } catch (e) {
    console.log('connectAllDb error', e);
    return;
  }

  connectionMap = tenants
    .map((tenant) => {
      const TENANT_DB_URI = `${process.env.BASE_DB_URI}/${tenant.subDomain}`;
      return {
        [tenant.subDomain]: initTenantDbConnection(TENANT_DB_URI),
      };
    })
    .reduce((prev, next) => {
      return Object.assign({}, prev, next);
    }, {});
  console.log(`Connecting to tenants dbs (${tenants?.length}) ...`);
};

/**
 * Get the connection information (knex instance) for the given tenant's slug.
 */
const getConnectionByTenant = (tenantName) => {
  if (connectionMap) {
    return connectionMap[tenantName];
  }
};

const addTenantConnection = (tenantName) => {
  console.log(`Adding connection for ${tenantName}`);
  const TENANT_DB_URI = `${process.env.BASE_DB_URI}/${tenantName}`;
  connectionMap[tenantName] = initTenantDbConnection(TENANT_DB_URI);
};

/**
 * Get the admin db connection.
 */
const getAdminConnection = () => {
  if (adminDbConnection) {
    console.log('Getting adminDbConnection');
    return adminDbConnection;
  }
};

/**
 * Get the connection information (knex instance) for current context. Here we have used a
 * getNamespace from 'continuation-local-storage'. This will let us get / set any
 * information and binds the information to current request context.
 */
const getConnection = () => {
  const nameSpace = getNamespace('unique context');
  const connection = nameSpace.get('connection');

  if (!connection) {
    throw new Error('Connection is not set for any tenant database');
  }

  return connection;
};

const getCurrentConnectionModels = () => {
  const connection = getConnection();
  const { models } = connection;
  return models;
};

module.exports = {
  connectAllDb,
  getAdminConnection,
  getConnection,
  getConnectionByTenant,
  addTenantConnection,
  getCurrentConnectionModels,
};
