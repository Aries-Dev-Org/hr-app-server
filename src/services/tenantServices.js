// const { addTenantConnection } = require('../db/connectionManager');

module.exports.getAllTenants = async (dbConnection) => {
  const TenantModel = dbConnection.model('Tenant');
  return TenantModel.find({});
};

module.exports.createTenant = async (dbConnection, data) => {
  const TenantModel = dbConnection.model('Tenant');

  const newTenant = new TenantModel({ ...data });

  await newTenant.save();

  return newTenant;
};
