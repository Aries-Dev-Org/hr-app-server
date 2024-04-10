module.exports.getCurrentGoalsQty = async (models) => {
  return await models.Goal.find({ processed: false }).count();
};

module.exports.getCurrentGoalsQtyByUser = async (userId, models) => {
  return await models.Goal.find({ toUserId: userId, processed: false }).count();
};

module.exports.getCurrentGoalsDoneQtyByUser = async (userId, models) => {
  return await models.Goal.find({
    toUserId: userId,
    processed: false,
    note: { $gt: 0 },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQty = async (models) => {
  return await models.Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQtyByUser = async (
  userId,
  models
) => {
  return await models.Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQty = async (models) => {
  return await models.Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQtyByUser = async (userId, models) => {
  return await models.Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};
