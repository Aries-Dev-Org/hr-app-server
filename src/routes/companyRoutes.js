const companyRoutes = require('express').Router();
const {
  createCompany,
  updateCompany,
  getAllStatus,
} = require('../services/companyServices');

//Crear datos de la empresa
companyRoutes.post('/', async (req, res) => {
  const company = await createCompany(req.body);
  res.status(201).send({
    payload: { company },
    message: 'Datos creados correctamente',
  });
});

//Editar datos de la empresa
companyRoutes.put('/', async (req, res) => {
  const company = await updateCompany(req.body);
  res.status(201).send({
    payload: { company },
    message: 'Datos Actualizados correctamente',
  });
});

//Consultar status de la empresa
companyRoutes.get('/status', async (req, res) => {
  const status = await getAllStatus();
  res.status(200).send({ status });
});

module.exports = companyRoutes;
