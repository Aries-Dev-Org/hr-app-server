const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

const userProfileRoutes = require('express').Router();

userProfileRoutes.get('/', async (_, res) => {
  const userProfiles = await UserProfile.find({});
  res.status(200).send({ userProfiles });
});

userProfileRoutes.post('/', async (req, res) => {
  const newUserProfile = new UserProfile(req.body);
  await newUserProfile.save();
  const userProfiles = await UserProfile.find({});
  res.status(200).send({
    payload: { userProfiles },
    message: 'Perfil creado correctamente',
  });
});

userProfileRoutes.put('/user', async (req, res) => {
  const { userId, userProfileId } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: { profiles: userProfileId },
    },
    { new: true }
  )
    .select('fullname profiles')
    .populate('profiles');

  res.status(200).send({
    payload: { updatedUser },
    message: 'Perfil agregado correctamente',
  });
});

module.exports = userProfileRoutes;
