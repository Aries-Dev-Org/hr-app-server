const Goal = require('../models/Goal');

module.exports.getCurrentGoalsQty = async () => {
  return await Goal.find({ processed: false }).count();
};

module.exports.getCurrentGoalsQtyByUser = async (userId) => {
  return await Goal.find({ toUserId: userId, processed: false }).count();
};

module.exports.getCurrentGoalsDoneQtyByUser = async (userId) => {
  return await Goal.find({
    toUserId: userId,
    processed: false,
    note: { $gt: 0 },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQty = async () => {
  return await Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithFeedbacksQtyByUser = async (userId) => {
  return await Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$feedbacks' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQty = async () => {
  return await Goal.find({
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};

module.exports.getCurrentGoalsWithTodosQtyByUser = async (userId) => {
  return await Goal.find({
    toUserId: userId,
    processed: false,
    $expr: { $gt: [{ $size: '$todos' }, 0] },
  }).count();
};
