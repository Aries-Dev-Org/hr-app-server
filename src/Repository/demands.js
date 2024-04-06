const Demand = require('../models/Demand');

module.exports.getDemandsQty = async () => {
  return await Demand.find({}).count();
};

module.exports.getCompletedDemandsQty = async () => {
  return await Demand.find({ state: 'done' }).count();
};
