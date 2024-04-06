const User = require('../models/User');
const Category = require('../models/Category');

module.exports.getUsersQty = async () => {
  return await User.find({ isSuperAdmin: false }).count();
};

module.exports.getActiveUsersQty = async () => {
  return await User.find({ isSuperAdmin: false, active: true }).count();
};

module.exports.getCurrentActionPlansQty = async () => {
  return await User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
  }).count();
};

module.exports.getCurrentActionPlansSeenQty = async () => {
  return await User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
    'actionPlan.seen': true,
  }).count();
};

module.exports.getGoldCategoryUsersQty = async () => {
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
  const { minPoints, maxPoints } = await Category.findOne({ value: 'Silver' });
  return await User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getBronzeCategoryUsersQty = async () => {
  const { minPoints, maxPoints } = await Category.findOne({ value: 'Bronze' });
  return await User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getWithoutCategoryUsersQty = async () => {
  const { minPoints } = await Category.findOne({ value: 'Bronze' });
  return await User.find({
    isSuperAdmin: false,
    active: true,
    'score.totalScore': { $lt: minPoints },
  }).count();
};
