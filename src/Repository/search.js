const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getSearchesDataForReport = async () => {
  const { Search } = getCurrentConnectionModels();

  return await Search.find()
    .populate({ path: 'area', select: 'name' })
    .populate({
      path: 'postulatedUsers',
      select: 'fullname area',
      populate: { path: 'area', select: 'name' },
    });
};

module.exports.getSearchesQty = async (models) => {
  return await models.Search.find({}).count();
};

module.exports.getSearchesPostulations = async (models) => {
  const searches = await models.Search.find({}).select('postulatedUsers');
  let qty = 0;
  for (let i = 0; i < searches.length; i++) {
    qty = qty + searches[i].postulatedUsers.length;
  }
  return qty;
};
