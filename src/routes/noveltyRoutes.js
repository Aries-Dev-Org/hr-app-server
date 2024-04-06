const noveltyRoutes = require('express').Router();
const { getNovelties, createNovelty } = require('../services/noveltyServices');

// Obtener las novedades
noveltyRoutes.get('/', async (_, res) => {
  const novelties = getNovelties();
  res.status(200).send(novelties);
});

// Crear una novedad
noveltyRoutes.post('/', async (req, res) => {
  const novelties = await createNovelty(req, {
    ...req.body,
    createUserId: req.user._id,
  });

  res.status(200).send({
    payload: { novelties },
    message: 'Novedad creada correctamente',
  });
});

module.exports = noveltyRoutes;
