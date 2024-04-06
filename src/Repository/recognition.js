const Recognition = require('../models/Recognition');

module.exports.getRecognitionsQty = async () => {
  return await Recognition.find({}).count();
};
