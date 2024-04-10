const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getRecognitionsQty = async () => {
  const { Recognition } = getCurrentConnectionModels();

  return await Recognition.find({}).count();
};
