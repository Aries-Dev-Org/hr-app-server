/* eslint-disable no-mixed-operators */
const userRoutes = require('express').Router();
// const fs = require('fs');
// const path = require('path');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const encryptPassword = require('../helpers/encryptPassword');
const logger = require('../services/logger');
const { linkUserToArea, unlinkUserToArea } = require('../services/userArea');
const {
  searchUsers,
  getAllUsers,
  updateAssistanceScores,
  updateDevelopmentHistory,
  deactivateUser,
  activateUser,
  unlinkUserFromAffectedUsers,
  getUserGoalsData,
} = require('../services/userServices');
const { updateCoinsByBenefit } = require('../services/updateScores');
const uploadToSpaces = require('../middlewares/multerv2');
const Area = require('../models/Area');
const moment = require('moment');
const { getTranslatedRole } = require('../helpers/enumRoles');
const Benefit = require('../models/Benefit');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const { Configuration, OpenAIApi } = require('openai');
const bcrypt = require('bcrypt');
const Goal = require('../models/Goal');
const {
  getCurrentGoalsQtyByUser,
  getCurrentGoalsDoneQtyByUser,
  getCurrentGoalsWithFeedbacksQtyByUser,
  getCurrentGoalsWithTodosQtyByUser,
} = require('../Repository/goal');

const upload = multer();

// Actualiza los datos personales del usuario
userRoutes.put('/personal-data', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        personalData: req.body,
      },
      { new: true }
    );
    if (!user) return res.status(404).send({ message: 'El usuario no existe' });

    res.status(201).send({
      payload: { personalData: user.personalData },
      message: 'Datos personales actualizados correctamente',
    });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(`[userRoutes - personal-data - PUT] - ${err.message}`);
  }
});

// Actualiza el presentismo de una lista de usuarios. El body debe ser {scores: [{id: '..', score: }, { id: '', score: }....]}
userRoutes.put('/assistance-score', verifyToken, async (req, res) => {
  await updateAssistanceScores(req.body);

  const users = await getAllUsers();

  res.status(201).send({
    payload: { users },
    message: 'Presentismos actualizados',
  });
});

// actualiza el plan de accion de un usuario
userRoutes.put(
  '/action-plan/:toUserId/:origin',
  verifyToken,
  async (req, res) => {
    const { actionPlan } = req.body;
    const { toUserId, origin } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      toUserId,
      { actionPlan: { ...actionPlan, createUserId: req.user._id } },
      { new: true }
    )
      .select('-password')
      .populate({
        path: 'area',
        populate: [
          { path: 'bosses', select: 'fullname email avatar entry' },
          { path: 'employees', select: 'fullname email avatar entry' },
          {
            path: 'dependentAreas',
            select: 'name bosses withoutBoss',
            populate: [
              { path: 'bosses', select: 'fullname email avatar entry' },
              { path: 'employees', select: 'fullname email avatar entry' },
            ],
          },
        ],
      })
      .populate('profiles');

    const finalPayload =
      origin === 'creator'
        ? { userData: updatedUser }
        : { actionPlan: updatedUser.actionPlan };

    res.status(201).send({
      payload: finalPayload,
      message: 'Plan de acción actualizado correctamente',
    });
  }
);

userRoutes.get('/', verifyToken, async (_, res) => {
  const users = await getAllUsers();
  res.status(200).send({ users });
});

// Registrar usuario
userRoutes.post('/register', verifyToken, verifyAdmin, async (req, res) => {
  const { password } = req.body;

  const userExists = await User.findOne({ email: req.body.email }).sort({
    fullname: 1,
  });
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

    if (userSaved.area) {
      await linkUserToArea(userSaved);
    }

    const users = await User.find({ isSuperAdmin: false }).populate('area');

    res
      .status(201)
      .send({ payload: { users }, message: 'Usuario creado correctamente' });
  } catch (err) {
    res.status(500).send({ message: err });
    logger.error(`[userRoutes - register - POST] - ${err}`);
  }
});

// Cargar usuarios desde una planilla
userRoutes.post(
  '/loadUsers',
  verifyToken,
  verifyAdmin,
  upload.single('file'),
  async (req, res) => {
    const { file } = req;
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const users = [];
      const rows = await readXlsxFile(Buffer.from(file.buffer));

      for (let i = 1; i < rows.length; i++) {
        const user = {};
        user['name'] = rows[i][0];
        user['lastname'] = rows[i][1];
        user['fullname'] = `${user.name} ${user.lastname}`;
        user['dni'] = rows[i][2];
        user['password'] = encryptPassword(String(user.dni));
        user['mustChangePassword'] = true;
        user['email'] = rows[i][3];
        user['role'] = rows[i][4] === 'jefe' ? 'boss' : 'employee';
        user['roleLabel'] = rows[i][5];
        user['entry'] = rows[i][6];
        user['isAdmin'] = rows[i][7] === 'si' ? true : false;
        const existingUser = users.find(
          (prevUser) => prevUser.email === user.email
        );
        if (!existingUser) {
          users.push(user);
        }
      }

      try {
        await User.insertMany(users);
        const usersDB = await User.find({ isSuperAdmin: false })
          .populate('area')
          .sort({ fullname: 'asc' });
        res.status(201).send({
          payload: { users: usersDB },
          message: `Usuarios cargados correctamente (${users.length})`,
        });
      } catch (_) {
        logger.error('[userRoutes - loadUsers - POST]');
        res
          .status(500)
          .send({ message: 'Ha ocurrido un error en el servidor' });
      }
    } else {
      logger.error('[userRoutes - loadUsers - POST] - Wrong file format');
      res.status(404).send({
        message: 'El archivo cargado no es del formato correcto.',
      });
    }
  }
);

// Resetea el password
userRoutes.post('/updatePassword', async (req, res) => {
  const { password, userId } = req.body;

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

// Devuelve usuarios por un valor que coincida con su name, lastname o email
userRoutes.get('/search', verifyToken, async (req, res) => {
  const { data, pages } = await searchUsers(req, res);
  res.status(200).send({ data, pages });
});

// Obtener usuario por id
userRoutes.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'area',
        populate: [
          { path: 'bosses', select: 'fullname email avatar entry' },
          { path: 'employees', select: 'fullname email avatar entry' },
          {
            path: 'dependentAreas',
            select: 'name bosses withoutBoss',
            populate: [
              { path: 'bosses', select: 'fullname email avatar entry' },
              { path: 'employees', select: 'fullname email avatar entry' },
            ],
          },
        ],
      })
      .populate('profiles')
      .populate({ path: 'actionPlan.createUserId', select: 'fullname avatar' });

    !userData && res.status(404).send({ message: 'El usuario no existe' });

    let managementArea;

    if (userData?.area?.parentArea) {
      managementArea = await Area.findById(userData.area.parentArea);
    } else {
      managementArea = null;
    }

    const userGoalStatus = await getUserGoalsData(userId);

    res
      .status(200)
      .send({ userData, userGoalStatus, managementArea, ponderations: {} });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(`[userRoutes - /:id - GET] - ${err.message}`);
  }
});

// Cambiar contraseña
userRoutes.put('/updatePassword', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const userDb = await User.findById(req.user._id);

  const isCorrectPassword = bcrypt.compareSync(oldPassword, userDb.password);

  if (!isCorrectPassword) {
    return res.status(400).send({
      payload: {},
      message: 'La contraseña actual ingresada es incorrecta',
    });
  }

  userDb.password = encryptPassword(newPassword);

  await userDb.save();

  res.status(201).send({
    payload: {},
    message: 'Contraseña actualizada correctamente.',
  });
});

// Subir imágen de avatar a Spaces
userRoutes.put(
  '/uploadAvatarToSpaces',
  verifyToken,
  uploadToSpaces(`${process.env.NODE_ENV}/${process.env.APPLICATION}/avatars`),
  async (req, res) => {
    const { Location } = req.file;

    await User.findByIdAndUpdate(req.user._id, {
      avatar: Location,
    });

    res.status(201).send({
      payload: { avatar: Location },
      message: 'Avatar editado correctamente',
    });
  }
);

//Actualiza las monedas de un usuario en base a demands, evaluaciones, capacitaciones, reconocimientos...
userRoutes.put('/coins/:reason/:reasonId', verifyToken, async (req, res) => {
  // if (req.params.reason === 'demand') {
  //   await updateCoinsByDemand(req);
  //   const user = await User.findById(req.user._id);
  //   res.status(201).send({
  //     payload: { coins: user.coins, coinsMovements: user.coinsMovements },
  //   });
  // } else if (req.params.reason === 'benefit') {
  await updateCoinsByBenefit(req);
  const user = await User.findById(req.user._id);
  const benefits = await Benefit.find({})
    .populate('category')
    .populate({ path: 'applicants', select: 'fullname avatar' });

  res.status(201).send({
    payload: {
      coins: user.coins,
      coinsMovements: user.coinsMovements,
      benefits,
    },
  });
  // }
});

userRoutes.put('/developmentHistory', verifyToken, async (req, res) => {
  const { userId, changeInfo } = req.body;
  const userUpdated = await updateDevelopmentHistory(userId, changeInfo);

  res.status(200).send({
    message: 'Los datos se guardaron correctamente',
    payload: { newHistory: userUpdated.developmentHistory },
  });
});

userRoutes.put('/activate', verifyToken, async (req, res) => {
  const { userId } = req.body;

  await activateUser(userId);
  const users = await getAllUsers();

  res.status(201).send({
    message: 'Usuario activado correctamente',
    payload: { users },
  });
});

userRoutes.put('/deactivate', verifyToken, async (req, res) => {
  const { userId, areaId, role, motive } = req.body;

  await deactivateUser(userId, areaId, role, motive);
  const users = await getAllUsers();

  res.status(201).send({
    message: 'Usuario desactivado correctamente',
    payload: { users },
  });
});

// Actualiza información general de un usuario
userRoutes.put('/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const currentUser = await User.findById(userId);
    let developmentHistoryChange;

    if (
      (req.body.area && String(currentUser.area) !== req.body.area) ||
      (req.body.role && req.body.role !== currentUser.role)
    ) {
      await unlinkUserToArea(currentUser);
      await unlinkUserFromAffectedUsers(userId);
      const newArea = await Area.findById(req.body.area);
      const date = moment().format('DD/MM/YY');
      const role = getTranslatedRole(req.body.role);
      developmentHistoryChange = `${date} - Pasó a ser ${role} del área ${newArea.name}`;
    }

    let user;
    if (developmentHistoryChange) {
      user = await User.findByIdAndUpdate(
        userId,
        {
          ...req.body,
          surveysResponses: [],
          $push: { developmentHistory: developmentHistoryChange },
          evaluationRelationships: {
            confirmed: false,
            affectedUsers: [],
          },
        },
        { new: true }
      );
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        { ...req.body, surveysResponses: [] },
        { new: true }
      );
    }

    if (!user) return res.status(404).send({ message: 'El usuario no existe' });

    if (req.body.area) {
      await linkUserToArea(user);
    }

    const users = await User.find({ isSuperAdmin: false })
      .populate('area')
      .sort({ fullname: 'asc' });

    res.status(201).send({
      payload: { users },
      message: 'Usuario actualizado correctamente',
    });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
    logger.error(`[userRoutes - / - PUT] - ${err.message}`);
  }
});

userRoutes.get('/game/random', async (req, res) => {
  const users = await User.find({}).select('avatar fullname').limit(5);
  res.status(200).send(users);
});

userRoutes.get('/game/quiz', async (req, res) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      prompt: `Sos experto en Javascript. Mandame en formato JSON un array de 4 posiciones, en donde cada posición va a ser un objeto que contenga
      en la key "question", una pregunta al azar de categoría "geografía", "historia", "arte" o "deporte".
      en la  key "category", la categoría que corresponde a esa pregunta, 
      y en la key "answers" un array de 4 objetos. Cada objeto debe tener una posible respuesta, en la key "text", y en la key "correct", 
      debe indicar si es verdadera o no con un valor "true" o "false" respectivamente.`,
      model: 'text-davinci-003',
      temperature: 0.7,
      max_tokens: 1000,
    });
    res.status(201).send(response.data.choices[0]);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = userRoutes;
