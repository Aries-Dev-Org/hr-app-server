const notificationRoutes = require('express').Router();
const {
  getNotifications,
  deleteNotification,
} = require('../services/notificationServices');

// Obtiene las notificaciones para el usuario logueado
notificationRoutes.get('/', async (req, res) => {
  const notifications = await getNotifications(req.user._id);
  res.status(200).send(notifications);
});

// Elimina una notificación
notificationRoutes.delete('/:type', async (req, res) => {
  const notifications = await deleteNotification(req.params.type, req.user._id);
  res.status(200).send(notifications);
});

module.exports = notificationRoutes;
