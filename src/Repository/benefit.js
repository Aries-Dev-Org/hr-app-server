const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getBenefitsDataForReport = async () => {
  const { Benefit } = getCurrentConnectionModels();

  return await Benefit.find({ isActive: true })
    .populate({
      path: 'category',
      select: 'name',
    })
    .populate({
      path: 'applicants',
      select: 'fullname area',
      populate: { path: 'area', select: 'name' },
    });
};
