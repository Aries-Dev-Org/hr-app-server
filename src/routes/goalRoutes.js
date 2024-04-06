/* eslint-disable no-unused-vars */
/* eslint-disable no-mixed-operators */
const goalRoutes = require('express').Router();
const Goal = require('../models/Goal');
const User = require('../models/User');
const { getGoals, getUserCurrentGoals } = require('../services/goalServices');
const { sendNotification } = require('../services/notificationServices');
const { GOAL } = require('../constants/notificationTypes');
const { NEW_GOAL, UPDATE_GOAL } = require('../constants/notificationSubTypes');
const mailer = require('../services/mailer');
const { isValidEmail } = require('../helpers/isValidEmail');

goalRoutes.get('/user/:userId', async (req, res) => {
  const goals = await getUserCurrentGoals(req.params.userId);
  res.status(200).send({ goals });
});

goalRoutes.get('/:goalsDate', async (req, res) => {
  const goalsDate = req.params.goalsDate;
  const { goals, previousEvaluations } = await getGoals(req.user, goalsDate);
  res.status(200).send({ goals, previousEvaluations });
});

goalRoutes.post('/', async (req, res) => {
  const newGoal = new Goal({ ...req.body, createUserId: req.user._id });
  await newGoal.save();
  const { goals } = await getGoals(req.user, 'current');

  const destinations = req.body.group
    ? req.body.toUsersIds
    : [req.body.toUserId];

  for await (const userId of destinations) {
    const userDB = await User.findById(userId);

    sendNotification(req, userId, GOAL, NEW_GOAL);

    if (isValidEmail(userDB.email)) {
      mailer.sendEmail([userDB.email], NEW_GOAL, {
        name: userDB.fullname,
        userAsign: req.user.fullname,
        link: 'objetivos',
        group: req.body.group,
      });
    }
  }

  res.status(201).send({
    payload: { goals },
    message: 'Objetivo creado correctamente',
  });
});

goalRoutes.put('/todos/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const { todos } = req.body;

  await Goal.findByIdAndUpdate(goalId, { todos });

  const { goals } = await getGoals(req.user, 'current');

  res.status(200).send({
    payload: { goals },
    message: 'Objetivo actualizado correctamente',
  });
});

goalRoutes.put('/feedbacks/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const { feedbacks } = req.body;

  const updatedGoal = await Goal.findByIdAndUpdate(
    goalId,
    { feedbacks },
    { new: true }
  );

  const destinations = updatedGoal.group
    ? updatedGoal.toUsersIds
    : [updatedGoal.toUserId];

  for await (const userId of destinations) {
    sendNotification(req, userId, GOAL, UPDATE_GOAL);
  }

  const { goals } = await getGoals(req.user, 'current');

  res.status(200).send({
    payload: { goals },
    message: 'Objetivo actualizado correctamente',
  });
});

goalRoutes.put('/:goalId', async (req, res) => {
  const { goalId } = req.params;

  const updatedGoal = await Goal.findByIdAndUpdate(
    goalId,
    {
      ...req.body,
    },
    { new: true }
  ).populate({
    path: 'toUserId',
    select: 'score',
  });

  const destinations = updatedGoal.group
    ? updatedGoal.toUsersIds
    : [updatedGoal.toUserId];

  for await (const userId of destinations) {
    sendNotification(req, userId, GOAL, UPDATE_GOAL);
  }

  const { goals } = await getGoals(req.user, 'current');

  res.status(200).send({
    payload: { goals },
    message: 'Objetivo actualizado correctamente',
  });
});

goalRoutes.delete('/:goalId', async (req, res) => {
  const { goalId } = req.params;

  await Goal.findByIdAndRemove(goalId);

  const { goals } = await getGoals(req.user, 'current');

  res.status(200).send({
    payload: { goals },
    message: 'Objetivo eliminado correctamente',
  });
});

goalRoutes.delete('/', async (_, res) => {
  await Goal.deleteMany({});
  await User.updateMany(
    {},
    {
      score: { competences: 0, objetives: 0, assistance: 0, totalScore: 0 },
    }
  );

  res.status(200).send({
    payload: { goals: [] },
    message: 'Objetivos borrados correctamente',
  });
});

module.exports = goalRoutes;
