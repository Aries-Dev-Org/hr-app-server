const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getCurrentGoalsQty = async () => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({ processed: false }).count();
};

module.exports.getCurrentGoalsQtyByUser = async (userId) => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({ toUserId: userId, processed: false }).count();
};

module.exports.getCurrentGoalsDoneQtyByUser = async (userId) => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({
    toUserId: userId,
    processed: false,
    note: { $gt: 0 },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQty = async () => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQtyByUser = async (userId) => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQty = async () => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQtyByUser = async (userId) => {
  const { Goal } = getCurrentConnectionModels();

  return await Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};
