module.exports.getDemandsQty = async (models) => {
  return await models.Demand.find({}).count();
};

module.exports.getCompletedDemandsQty = async (models) => {
  return await models.Demand.find({ state: 'done' }).count();
};
