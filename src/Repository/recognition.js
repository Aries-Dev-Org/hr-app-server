module.exports.getRecognitionsQty = async (models) => {
  return await models.Recognition.find({}).count();
};
