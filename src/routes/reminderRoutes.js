const reminderRoutes = require('express').Router();
const {
  getReminders,
  createReminder,
} = require('../services/reminderServices');

// Obtener los recordatorios
reminderRoutes.get('/', async (_, res) => {
  const reminders = getReminders();
  res.status(200).send(reminders);
});

// Crear un recodatorio
reminderRoutes.post('/', async (req, res) => {
  const reminders = await createReminder(req, {
    ...req.body,
    createUserId: req.user._id,
  });

  res.status(200).send({
    payload: { reminders },
    message: 'Recordatorio generado correctamente',
  });
});

module.exports = reminderRoutes;
