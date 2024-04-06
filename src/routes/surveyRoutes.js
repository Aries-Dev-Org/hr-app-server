const surveyRoutes = require('express').Router();
const User = require('../models/User');

//Enviar un estado de animo
surveyRoutes.put('/', async (req, res) => {
  const { emotion, coins } = req.body;
  const user = await User.findById(req.user._id);
  const coinsMovement = {
    date: new Date(),
    operation: 'Encuesta Respondida',
    qty: coins,
  };
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $push: { surveysResponses: emotion, coinsMovements: coinsMovement },
      showSurvey: false,
      coins: user.coins + coins,
    },
    { new: true }
  );

  const { showSurvey, surveysResponses, coinsMovements } = updatedUser;
  res.status(201).send({
    payload: {
      showSurvey,
      coins: updatedUser.coins,
      surveysResponses,
      coinsMovements,
    },
    message: `Muchas gracias por tu respuesta! Ganaste ${coins} monedas`,
  });
});

//Borrar todos los estados de animo (PARA POSTMAN)
surveyRoutes.delete('/', async (_, res) => {
  await User.updateMany(
    { active: true, isNotEvaluable: false },
    {
      surveysResponses: [],
      showSurvey: true,
    },
    { new: true }
  );

  res.status(200).send({
    payload: {},
    message: 'Respuestas eliminadas',
  });
});

module.exports = surveyRoutes;
