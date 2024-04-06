const { emitSocketEvent } = require('../helpers/emitSocketEvent');
const Novelty = require('../models/Novelty');

module.exports.getNovelties = async () => {
  return await Novelty.find({}).sort({ createdAt: -1 });
};

module.exports.createNovelty = async (req, data) => {
  const newNovelty = new Novelty(data);
  await newNovelty.save();
  if (req) {
    emitSocketEvent(req, 'comunication-created');
  }
  return await Novelty.find({}).sort({ createdAt: -1 });
};
