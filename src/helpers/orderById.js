module.exports.orderById = (orderedArray, a, b) => {
  const indexA = orderedArray.indexOf(a._id.toString());
  const indexB = orderedArray.indexOf(b._id.toString());

  return indexA - indexB;
};
