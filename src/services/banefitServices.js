const Benefit = require('../models/Benefit');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const User = require('../models/User');

module.exports.getBenefits = async () =>
  await Benefit.find({})
    .populate('category')
    .populate({ path: 'applicants', select: 'fullname avatar' });

module.exports.createBenefit = async (data) => {
  const newBenefit = new Benefit(data);
  await newBenefit.save();
  return await this.getBenefits();
};

module.exports.updateBenefit = async (data) => {
  await Benefit.findByIdAndUpdate(data.id, data, { new: true }).populate(
    'category'
  );
  return await this.getBenefits();
};

module.exports.updateBenefitApplicants = async (data) => {
  await Benefit.findByIdAndUpdate(data.id, {
    $addToSet: { applicants: data.applicant },
  });
  return await this.getBenefits();
};

module.exports.updateImage = async (req, res, err) => {
  if (err) {
    if (err.message === 'File too large') {
      return res.status(400).send({ message: 'La imágen es muy pesada' });
    }
    return res.status(400).send({ message: err.message });
  }

  const file = req.file;

  const imagePath = `${process.env.IMAGES_BASE_URL}/benefit/${file.filename}`;
  const benefitDb = await Benefit.findById(req.params.id);

  if (benefitDb.image) {
    const location = path.resolve(
      __dirname,
      `../public/images/benefit/${benefitDb.image.split('/images/benefit/')[1]}`
    );
    if (fs.existsSync(location)) {
      fs.unlinkSync(location);
    } else {
      logger.error(
        `[benefitRoutes - /uploadImage - PUT] - File doesn't exist. ${benefitDb.title} - ${location}`
      );
    }
  }

  benefitDb.image = imagePath;
  await benefitDb.save();
  return await this.getBenefits();
};
