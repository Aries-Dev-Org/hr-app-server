const adminRoutes = require('express').Router();

const { getConnection } = require('../db/connectionManager');
const tenantService = require('../services/tenantServices');

// Obtener todos los clientes
adminRoutes.get('/', async (_, res) => {
  const dbConnection = getConnection();
  const tenants = await tenantService.getAllTenants(dbConnection);
  res.status(200).send({ tenants });
});

// Obtener un cliente
adminRoutes.get('/:id', async (_, res) => {
  res.status(200).send({ tenats: [] });
});

// Actualizar un cliente
adminRoutes.put('/:id', async (req, res) => {
  res.status(200).send({ tenat: {} });
});

// Crear un cliente
adminRoutes.post('/', async (req, res) => {
  const dbConnection = getConnection();
  const tenant = await tenantService.createTenant(dbConnection, req.body);
  res.status(200).send({ tenant });
});

// Elimina un cliente
adminRoutes.delete('/:id', async (req, res) => {
  res.status(200).send({});
});

module.exports = adminRoutes;
