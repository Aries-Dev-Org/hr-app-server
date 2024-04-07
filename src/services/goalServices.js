const Area = require('../models/Area');
const Evaluation = require('../models/Evaluation');
const Goal = require('../models/Goal');
const User = require('../models/User');

module.exports.getGoals = async (user, goalsDate = null) => {
  let addCondition = {};
  let goals;

  if (goalsDate && goalsDate === 'current') {
    addCondition = { processed: false };
  }
  if (goalsDate && goalsDate === 'previous') {
    addCondition = { processed: true };
  }

  // Si el usuario es jefe y no es superadmin
  // busco los objetivos que tiene asignados y los que crearon los otros jefes de la misma area
  if (user.role === 'boss' && !user.isSuperAdmin) {
    const area = await Area.findById(user.area);
    goals = await Goal.find({
      $or: [
        { toUserId: user._id },
        { createUserId: { $in: area.bosses } },
        { toUsersIds: { $in: user._id } },
      ],
      ...addCondition,
    })
      .populate({
        path: 'createUserId',
        select: 'name lastname avatar',
      })
      .populate({
        path: 'toUserId',
        select: 'name lastname avatar',
      })
      .populate({
        path: 'toUsersIds',
        select: 'name lastname avatar',
      })
      .sort({ createdAt: 'desc' });
  } else {
    // Si el usuario es empleado o superadmin
    // busco los objetivos que me asignaron (empleado) o que asigné (superadmin)
    goals = await Goal.find({
      $or: [
        { toUserId: user._id },
        { createUserId: user._id },
        { toUsersIds: { $in: user._id } },
      ],
      ...addCondition,
    })
      .populate({
        path: 'createUserId',
        select: 'name lastname avatar',
      })
      .populate({
        path: 'toUserId',
        select: 'name lastname avatar',
      })
      .populate({
        path: 'toUsersIds',
        select: 'name lastname avatar',
      })
      .sort({ createdAt: 'desc' });
  }

  const previousEvaluations = await Evaluation.find({ done: true }).select(
    '_id name'
  );
  return { goals, previousEvaluations };
};

module.exports.getUserCurrentGoals = async (userId) => {
  const user = await User.findById(userId);
  return await Goal.find({
    $or: [{ toUserId: user._id }, { toUsersIds: { $in: user._id } }],
    processed: false,
  })
    .populate({
      path: 'createUserId',
      select: 'name lastname avatar',
    })
    .populate({
      path: 'toUserId',
      select: 'name lastname avatar',
    })
    .populate({
      path: 'toUsersIds',
      select: 'name lastname avatar',
    });
};

module.exports.processGoals = async () => {
  await Goal.updateMany({ processed: false }, { processed: true });
};
