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

module.exports.getSearchesQty = async () => {
  const { Search } = getCurrentConnectionModels();

  return await Search.find({}).count();
};

module.exports.getSearchesPostulations = async () => {
  const { Search } = getCurrentConnectionModels();

  const searches = await Search.find({}).select('postulatedUsers');
  let qty = 0;
  for (let i = 0; i < searches.length; i++) {
    qty = qty + searches[i].postulatedUsers.length;
  }
  return qty;
};
