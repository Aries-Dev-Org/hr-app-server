const searchRoutes = require('express').Router();
const { verifyAdmin } = require('../middlewares/authMiddleware');
const { APPLY_TO_POSTULATION } = require('../constants/notificationSubTypes');
const {
  getSearches,
  postulateToSearch,
  createSearch,
  deleteSearch,
  getSearch,
} = require('../services/searchServices');
const { sendNotification } = require('../services/notificationServices');
const { createNovelty } = require('../services/noveltyServices');
const { getAreaById } = require('../services/areaServices');

//Obtener las búsquedas
searchRoutes.get('/', async (_, res) => {
  const searches = await getSearches();
  res.status(200).send({ searches });
});

//Hacer una postulacion
searchRoutes.post('/postulate', async (req, res) => {
  const searchId = req.body.searchId;
  const userId = req.user._id;

  await postulateToSearch(searchId, userId);
  const searches = await getSearches();

  sendNotification(req, userId, APPLY_TO_POSTULATION);

  res.status(201).send({
    payload: { searches },
    message: 'Postulación realizada correctamente',
  });
});

//Crear una búsqueda
searchRoutes.post('/', verifyAdmin, async (req, res) => {
  const { job } = req.body;
  const area = await getAreaById(req.body.area);

  await createSearch(req);
  await createNovelty(req, {
    content: `Se ha iniciado una búsqueda para el puesto de ${job} en el sector ${area.name}.`,
    redirect: true,
    redirectLabel: 'Ver búsqueda',
    redirectUrl: '/empresa/busquedas',
  });

  const searches = await getSearches();

  res.status(201).send({
    payload: { searches },
    message: 'Búsqueda creada correctamente',
  });
});

// Eliminar una búsqueda y crea una novedad
searchRoutes.delete('/:id', async (req, res) => {
  const searchId = req.params.id;
  const search = await getSearch(searchId);
  const searches = await deleteSearch(searchId);
  await createNovelty(req, {
    content: `La búsqueda de ${search.job} para el área ${search.area.name} ha finalizado`,
  });
  res.status(201).send({
    payload: { searches },
    message: 'Búsqueda eliminada correctamente',
  });
});

module.exports = searchRoutes;
