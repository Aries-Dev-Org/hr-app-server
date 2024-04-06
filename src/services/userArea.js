const Area = require('../models/Area');

module.exports.linkUserToArea = async (userSaved) => {
  if (userSaved.role === 'employee') {
    await Area.findByIdAndUpdate(userSaved.area, {
      $addToSet: { employees: userSaved._id },
    });
  } else {
    await Area.findByIdAndUpdate(userSaved.area, {
      $addToSet: { bosses: userSaved._id },
    });
  }
};

module.exports.unlinkUserToArea = async (currentUser) => {
  if (currentUser.area && currentUser.role === 'employee') {
    await Area.findByIdAndUpdate(currentUser.area, {
      $pull: { employees: currentUser._id },
    });
  } else if (currentUser.area && currentUser.role === 'boss') {
    await Area.findByIdAndUpdate(currentUser.area, {
      $pull: { bosses: currentUser._id },
    });
  }
};
