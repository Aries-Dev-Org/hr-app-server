const Search = require('../models/Search');

module.exports.getSearches = async () => {
  return await Search.find({}).populate([
    { path: 'area', select: 'name' },
    { path: 'postulatedUsers', select: 'fullname avatar' },
  ]);
};

module.exports.postulateToSearch = async (searchId, userId) => {
  return await Search.findByIdAndUpdate(searchId, {
    $addToSet: { postulatedUsers: userId },
  });
};

module.exports.createSearch = async (req) => {
  const newSearch = new Search({ ...req.body, createUserId: req.user._id });
  return await newSearch.save();
};

module.exports.deleteSearch = async (searchId) => {
  await Search.findByIdAndRemove(searchId);
  const searches = this.getSearches();
  return searches;
};

module.exports.getSearch = async (searchId) => {
  const search = await Search.findById(searchId).populate({
    path: 'area',
    select: 'name',
  });
  return search;
};
