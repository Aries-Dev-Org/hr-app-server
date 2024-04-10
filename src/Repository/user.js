module.exports.getUsersQty = async (models) => {
  return await models.User.find({ isSuperAdmin: false }).count();
};

module.exports.getActiveUsersQty = async (models) => {
  return await models.User.find({ isSuperAdmin: false, active: true }).count();
};

module.exports.getCurrentActionPlansQty = async (models) => {
  return await models.User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
  }).count();
};

module.exports.getCurrentActionPlansSeenQty = async (models) => {
  return await models.User.find({
    isSuperAdmin: false,
    'actionPlan.text': { $ne: '' },
    'actionPlan.seen': true,
  }).count();
};

module.exports.getGoldCategoryUsersQty = async (models) => {
  const { minPoints, maxPoints } = await models.Category.findOne({
    value: 'Gold',
  });
  return await models.User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getSilverCategoryUsersQty = async (models) => {
  const { minPoints, maxPoints } = await models.Category.findOne({
    value: 'Silver',
  });
  return await models.User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getBronzeCategoryUsersQty = async (models) => {
  const { minPoints, maxPoints } = await models.Category.findOne({
    value: 'Bronze',
  });
  return await models.User.find({
    active: true,
    isSuperAdmin: false,
    'score.totalScore': { $gte: minPoints, $lte: maxPoints },
  }).count();
};

module.exports.getWithoutCategoryUsersQty = async (models) => {
  const { minPoints } = await models.Category.findOne({ value: 'Bronze' });
  return await models.User.find({
    isSuperAdmin: false,
    active: true,
    'score.totalScore': { $lt: minPoints },
  }).count();
};
