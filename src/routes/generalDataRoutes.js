const { getGeneralData } = require('../services/generalDataServices');
const generalDataRoutes = require('express').Router();

generalDataRoutes.get('/', async (req, res) => {
  const generalDataResponse = await getGeneralData(req.user._id);
  res.status(200).send(generalDataResponse);
});

module.exports = generalDataRoutes;
