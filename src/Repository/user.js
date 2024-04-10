const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getUsersQty = async () => {
  const { User } = getCurrentConnectionModels();

  return await User.find({ isSuperAdmin: false }).count();
};

module.exports.getActiveUsersQty = async () => {
  const { User } = getCurrentConnectionModels();

  return await User.find({ isSuperAdmin: false, active: true }).count();
};

module.exports.getCurrentActionPlansQty = async () => {
  const { User } = getCurrentConnectionModels();

  return await User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
  }).count();
};

module.exports.getCurrentActionPlansSeenQty = async () => {
  const { User } = getCurrentConnectionModels();

  return await User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
    'actionPlan.seen': true,
  }).count();
};

module.exports.getGoldCategoryUsersQty = async () => {
  const { Category, User } = getCurrentConnectionModels();

  const { minPoints, maxPoints } = await Category.findOne({
    value: 'Gold',
  });
  return await User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getSilverCategoryUsersQty = async () => {
  const { Category, User } = getCurrentConnectionModels();

  const { minPoints, maxPoints } = await Category.findOne({ value: 'Silver' });
  return await User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getBronzeCategoryUsersQty = async () => {
  const { Category, User } = getCurrentConnectionModels();

  const { minPoints, maxPoints } = await Category.findOne({ value: 'Bronze' });
  return await User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getWithoutCategoryUsersQty = async () => {
  const { Category, User } = getCurrentConnectionModels();

  const { minPoints } = await Category.findOne({ value: 'Bronze' });
  return await User.find({
    isSuperAdmin: false,
    active: true,
    'score.totalScore': { $lt: minPoints },
  }).count();
};
