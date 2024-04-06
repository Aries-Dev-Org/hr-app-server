const Search = require('../models/Search');

module.exports.getSearchesDataForReport = async () => {
  return await Search.find()
    .populate({ path: 'area', select: 'name' })
    .populate({
      path: 'postulatedUsers',
      select: 'fullname area',
      populate: { path: 'area', select: 'name' },
    });
};

module.exports.getSearchesQty = async () => {
  return await Search.find({}).count();
};

module.exports.getSearchesPostulations = async () => {
  const searches = await Search.find({}).select('postulatedUsers');
  let qty = 0;
  for (let i = 0; i < searches.length; i++) {
    qty = qty + searches[i].postulatedUsers.length;
  }
  return qty;
};
