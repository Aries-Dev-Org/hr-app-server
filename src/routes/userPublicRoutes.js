const userPublicRoutes = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyTokenLink } = require('../middlewares/authMiddleware');
const logger = require('../services/logger');
const mailer = require('../services/mailer');
const { RESET_PASSWORD } = require('../constants/notificationTypes');
const encryptPassword = require('../helpers/encryptPassword');
const { isValidEmail } = require('../helpers/isValidEmail');

// Loguear usuario
userPublicRoutes.post('/signin', async (req, res) => {
  try {
    const userDb = await User.findOne({
      email: req.body.email,
    })
      .populate({
        path: 'area',
        select: 'name management dependentAreas',
      })
      .populate('profiles');

    if (!userDb)
      return res.status(404).send({ message: 'Credenciales Inválidas' });

    if (!userDb.active)
      return res.status(404).send({ message: 'Usuario inactivo' });

    const isCorrectPassword = bcrypt.compareSync(
      req.body.password,
      userDb.password
    );
    if (!isCorrectPassword)
      return res.status(404).send({ message: 'Credenciales Inválidas' });

    const { _id, role, name, lastname, fullname, isAdmin, isSuperAdmin, area } =
      userDb;

    const payload = {
      _id,
      role,
      name,
      lastname,
      fullname,
      isAdmin,
      isSuperAdmin,
      area,
    };
    const userInfo = { ...userDb._doc };
    const accessToken = jwt.sign(payload, process.env.JWT_SEED, {
      expiresIn: '1d',
    });
    res.status(200).send({ token: accessToken, userInfo });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(`[userRoutes - signin - POST] - ${err.message}`);
  }
});

// Genera un link y lo envía por email para resetear la contraseña
userPublicRoutes.post('/sendResetPasswordLink', async (req, res) => {
  try {
    const userDb = await User.findOne({ email: req.body.email });

    if (!userDb) {
      return res.status(400).send({
        message: 'El Email ingresado no corresponde a ningún usuario.',
      });
    }

    const { _id, name, lastname, email } = userDb;
    const payload = { _id, name, lastname, email };

    const accessToken = jwt.sign(payload, process.env.JWT_SEED, {
      expiresIn: '5m',
    });

    const link = `login?rpat=${accessToken}`;
    if (isValidEmail(email)) {
      mailer.sendEmail([email], RESET_PASSWORD, { name, link });
    }

    res.status(201).send({
      message:
        'Enviamos un link a tu correo para que puedas cambiar la contraseña.',
    });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(
      `[userRoutes - /sendResetPasswordLink - POST] - ${err.message}`
    );
  }
});

// Resetea el password
userPublicRoutes.post('/resetPassword', verifyTokenLink, async (req, res) => {
  const { password } = req.body;
  const userId = req.userId;

  try {
    await User.findByIdAndUpdate(userId, {
      password: encryptPassword(password),
    });
    res.status(200).send({ message: 'La contraseña se cambió correctamente.' });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(`[userRoutes - /resetPassword - POST] - ${err.message}`);
  }
});

// Registrar un super admin
userPublicRoutes.post('/registerSuperAdminUserRoute', async (req, res) => {
  const { password, specialKeyword } = req.body;

  if (!specialKeyword || specialKeyword !== process.env.JWT_SEED) {
    return res.status(400).send({ message: 'No no no no ... Ojito.' });
  }

  const userExists = await User.findOne({ email: req.body.email });
  if (userExists) {
    return res
      .status(400)
      .send({ message: 'El usuario ya se encuentra registrado' });
  }

  try {
    const { name, lastname } = req.body;

    const newUser = new User({
      fullname: `${name} ${lastname}`,
      ...req.body,
      password: encryptPassword(password),
    });

    const userSaved = await newUser.save();

    res
      .status(201)
      .send({ payload: userSaved, message: 'Usuario creado correctamente' });
  } catch (err) {
    res.status(500).send({ message: err });
    logger.error(`[userPublicRoutes - register - POST] - ${err}`);
  }
});

module.exports = userPublicRoutes;
