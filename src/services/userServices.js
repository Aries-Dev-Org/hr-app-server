const User = require('../models/User');
const Area = require('../models/Area');
const moment = require('moment');
const { inactiveMotives } = require('../constants/inactiveMotives');
const {
  getCurrentGoalsQtyByUser,
  getCurrentGoalsDoneQtyByUser,
  getCurrentGoalsWithFeedbacksQtyByUser,
  getCurrentGoalsWithTodosQtyByUser,
} = require('../Repository/goal');

module.exports.unlinkUserFromAffectedUsers = async (userId) => {
  // Buscamos los usuarios en donde el usuario inactivo, aparece como affected User
  const users = await User.find({
    active: true,
    'evaluationRelationships.affectedUsers.user': userId,
  });

  // Los actualizamos, borrando al usuario del array
  await User.updateMany(
    { _id: { $in: users.map((user) => user._id) } },
    {
      $pull: { 'evaluationRelationships.affectedUsers': { user: userId } },
    }
  );
};

module.exports.searchUsers = async (req) => {
  const limit = 10;
  const {
    searchValue,
    area,
    role,
    type,
    active,
    page = 1,
    toAssign,
  } = req.query;

  if (toAssign === 'true') {
    const resp = await User.find({
      area: null,
      active: true,
      isNotEvaluable: false,
    })
      .sort({ name: 'asc' })
      .populate('area profiles')
      .skip(limit * (page - 1))
      .limit(limit);

    const usersCount = await User.find({
      area: null,
      active: true,
      isNotEvaluable: false,
    }).count();

    const pagesCount = Math.ceil(usersCount / limit);

    return { data: resp, pages: pagesCount };
  }

  let conditions = {};

  const andConditions = [{ isNotEvaluable: false }];

  // by fullname
  if (searchValue)
    andConditions.push({ fullname: { $regex: searchValue, $options: 'i' } });
  // by area
  if (area) andConditions.push({ area });
  // by role
  if (role) andConditions.push({ role });
  // by isAdmin
  if (type === 'admin') andConditions.push({ isAdmin: true });
  if (type === 'not-admin') andConditions.push({ isAdmin: false });
  // by active
  if (active === 'false') {
    andConditions.push({ active: false });
  } else {
    andConditions.push({ active: true });
  }

  if (andConditions.length) {
    conditions = {
      $and: andConditions,
    };
  }

  const count = await User.find(conditions).count();

  const usersDb = await User.find(conditions)
    .sort({ name: 'asc' })
    .populate('area profiles')
    .skip(limit * (page - 1))
    .limit(limit);

  const pages = Math.ceil(count / limit);

  return { data: usersDb, pages };
};

module.exports.getAllUsers = async () => {
  const users = await User.find({ isNotEvaluable: false })
    .select(
      'fullname avatar score email profiles role entry active isAdmin name lastname roleLabel range inactiveMotive'
    )
    .populate({ path: 'area', select: 'name' })
    .populate({ path: 'profiles', select: 'label' })
    .sort({ name: 'asc' })
    .lean();

  return users;
};

module.exports.updateAssistanceScores = async ({ scores }) => {
  await User.find({
    _id: { $in: scores.map((score) => score.id) },
    active: true,
    isNotEvaluable: false,
  })
    .cursor()
    .eachAsync(async (doc) => {
      const { score } = scores.find((score) => score.id === doc._id.toString());
      doc.score.assistance = score;
      await doc.save();
    });
};

module.exports.activateUser = async (userId) => {
  const date = moment().format('DD/MM/YY');
  const historyChange = `${date} - Ha sido reactivado`;

  return await User.findByIdAndUpdate(userId, {
    score: {
      objetives: 0,
      competences: 0,
      competencesScores: [],
      assistance: 0,
      totalScore: 0,
    },
    coins: 0,
    active: true,
    inactiveMotive: '',
    $push: {
      developmentHistory: historyChange,
    },
    evaluationRelationships: { confirmed: false, affectedUsers: [] },
  });
};

module.exports.deactivateUser = async (userId, areaId, role, motive) => {
  const date = moment().format('DD/MM/YY');
  const translatedMotve = inactiveMotives.find((m) => m.value === motive).label;
  const historyChange = `${date} - Ha sido inactivado, por ${translatedMotve}`;

  await this.unlinkUserFromAffectedUsers(userId);

  if (areaId) {
    if (role === 'boss') {
      await Area.findByIdAndUpdate(areaId, { $pull: { bosses: userId } });
    } else {
      await Area.findByIdAndUpdate(areaId, { $pull: { employees: userId } });
    }

    return await User.findByIdAndUpdate(userId, {
      $unset: { area: {} },
      active: false,
      inactiveMotive: motive,
      $push: {
        developmentHistory: historyChange,
      },
      evaluationRelationships: { confirmed: false, affectedUsers: [] },
    });
  }

  return await User.findByIdAndUpdate(userId, {
    active: false,
    inactiveMotive: motive,
    $push: {
      developmentHistory: historyChange,
    },
    evaluationRelationships: { confirmed: false, affectedUsers: [] },
  });
};

module.exports.getUserGoalsData = async (userId) => {
  const [goalsQty, goalDone, goalWithFeedback, goalsWithTodos] =
    await Promise.all([
      getCurrentGoalsQtyByUser(userId),
      getCurrentGoalsDoneQtyByUser(userId),
      getCurrentGoalsWithFeedbacksQtyByUser(userId),
      getCurrentGoalsWithTodosQtyByUser(userId),
    ]);

  const userGoalStatus = [
    {
      title: 'Objetivos actuales',
      data: goalsQty,
    },
    {
      title: 'Objetivos puntuados',
      data: `${goalDone}/${goalsQty}`,
      percentage: Number(`${(goalDone / goalsQty) * 100}`).toFixed(0),
    },
    {
      title: 'Objetivos actuales con feedbacks',
      data: `${goalWithFeedback}/${goalsQty}`,
      percentage: Number(`${(goalWithFeedback / goalsQty) * 100}`).toFixed(0),
    },
    {
      title: 'Objetivos actuales con tareas',
      data: `${goalsWithTodos}/${goalsQty}`,
      percentage: Number(`${(goalsWithTodos / goalsQty) * 100}`).toFixed(0),
    },
  ];

  return userGoalStatus;
};
