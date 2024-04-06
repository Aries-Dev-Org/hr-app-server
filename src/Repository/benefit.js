const Benefit = require('../models/Benefit');

module.exports.getBenefitsDataForReport = async () => {
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
