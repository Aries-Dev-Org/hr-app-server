const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getDemandsQty = async () => {
  const { Demand } = getCurrentConnectionModels();

  return await Demand.find({}).count();
};

module.exports.getCompletedDemandsQty = async () => {
  const { Demand } = getCurrentConnectionModels();

  return await Demand.find({ state: 'done' }).count();
};
