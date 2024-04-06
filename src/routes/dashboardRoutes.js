const dashboardRoutes = require('express').Router();
const { getDashboardData } = require('../services/dashboardServices');

dashboardRoutes.get('/', async (req, res) => {
  const dashboardData = await getDashboardData(req);
  res.status(200).send(dashboardData);
});

module.exports = dashboardRoutes;
