const congratulationRoutes = require('express').Router();
const User = require('../models/User');
const {
  getCongratulations,
  createCongratulation,
} = require('../services/congratulationServices');

// Obtener las felicitaciones
congratulationRoutes.get('/', async (_, res) => {
  const reminders = getCongratulations();
  res.status(200).send(reminders);
});

// Crear una felicitacion
congratulationRoutes.post('/', async (req, res) => {
  const { toUserId, content } = req.body;
  const userFullname = req.user.fullname;

  const congratulatedUser = await User.findById(toUserId).select('fullname');

  const formattedContent = `${userFullname} felicita a ${congratulatedUser.fullname} ${content}`;

  const congratulations = await createCongratulation(req, {
    content: formattedContent,
    toUserId,
    createUserId: req.user._id,
  });

  res.status(200).send({
    payload: { congratulations },
    message: 'Feicitación creada correctamente',
  });
});

module.exports = congratulationRoutes;
