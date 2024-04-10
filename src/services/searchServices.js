const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getSearches = async () => {
  const { Search } = getCurrentConnectionModels();

  return await Search.find({}).populate([
    { path: 'area', select: 'name' },
    { path: 'postulatedUsers', select: 'fullname avatar' },
  ]);
};

module.exports.postulateToSearch = async (searchId, userId) => {
  const { Search } = getCurrentConnectionModels();

  return await Search.findByIdAndUpdate(searchId, {
    $addToSet: { postulatedUsers: userId },
  });
};

module.exports.createSearch = async (req) => {
  const { Search } = getCurrentConnectionModels();

  const newSearch = new Search({ ...req.body, createUserId: req.user._id });
  return await newSearch.save();
};

module.exports.deleteSearch = async (searchId) => {
  const { Search } = getCurrentConnectionModels();

  await Search.findByIdAndRemove(searchId);
  const searches = this.getSearches();
  return searches;
};

module.exports.getSearch = async (searchId) => {
  const { Search } = getCurrentConnectionModels();

  const search = await Search.findById(searchId).populate({
    path: 'area',
    select: 'name',
  });
  return search;
};
