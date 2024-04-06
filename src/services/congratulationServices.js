const { emitSocketEvent } = require('../helpers/emitSocketEvent');
const Congratulation = require('../models/Congratulation');

module.exports.getCongratulations = async () => {
  return await Congratulation.find({}).sort({ createdAt: -1 });
};

module.exports.createCongratulation = async (req, data) => {
  const newCongratulation = new Congratulation(data);
  await newCongratulation.save();
  emitSocketEvent(req, 'comunication-created');
  return await Congratulation.find({}).sort({ createdAt: -1 });
};
