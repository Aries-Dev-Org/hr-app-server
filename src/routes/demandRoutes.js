const demandRoutes = require('express').Router();
const {
  getDemands,
  createDemand,
  updateDemand,
  demandSeen,
  addNewComment,
  deleteDemand,
} = require('../services/demandServices');

//Obtener las solicitudes del usuario loggeado
demandRoutes.get('/', async (req, res) => {
  const demands = await getDemands(req.user._id);
  res.status(200).send({ demands });
});

//Crear una solicitud
demandRoutes.post('/', async (req, res) => {
  const demands = await createDemand(req, {
    ...req.body,
    createUserId: req.user._id,
  });

  res.status(201).send({
    payload: { demands },
    message: 'Solicitud creada correctamente',
  });
});

//Marcar que una solicitud (nuevos mensajes y edicion) fue vista
demandRoutes.put('/seen', async (req, res) => {
  const { demandId } = req.body;

  const demands = await demandSeen(demandId, req.user._id);

  res.status(201).send({
    payload: { demands },
  });
});

//Actualizar una solicitud
demandRoutes.put('/:id', async (req, res) => {
  const { id } = req.params;

  const demands = await updateDemand(req, id, req.body, req.user._id);

  res.status(201).send({
    payload: { demands },
    message: 'Solicitud actualizada correctamente',
  });
});

// Agregar un comentario a una solicitud
demandRoutes.post('/comment/:demandId', async (req, res) => {
  const { body } = req;
  const { demandId } = req.params;

  const demands = await addNewComment(req, demandId, body);

  res.status(201).send({ payload: { demands } });
});

// Eliminar una solicitud
demandRoutes.delete('/:demandId', async (req, res) => {
  const { demandId } = req.params;

  const demands = await deleteDemand(demandId, req.user._id);

  res.status(200).send({
    payload: { demands },
    message: 'Solicitud eliminada correctamente',
  });
});

module.exports = demandRoutes;
