/* eslint-disable max-lines */
const queryRoutes = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const Area = require('../models/Area');
// const Benefit = require('../models/Benefit');
const Company = require('../models/Company');
const Competence = require('../models/Competence');
const Demand = require('../models/Demand');
const Evaluation = require('../models/Evaluation');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const Novelty = require('../models/Novelty');
const Recognition = require('../models/Recognition');
const Search = require('../models/Search');
const User = require('../models/User');
const UserEvaluation = require('../models/UserEvaluation');
const mailer = require('../services/mailer');
const UserProfile = require('../models/UserProfile');
const Config = require('../models/Config');
const encryptPassword = require('../helpers/encryptPassword');
const Reminder = require('../models/Reminder');
const Congratulation = require('../models/Congratulation');
const Category = require('../models/Category');
// const Channel = require('../models/Channel');
const { isValidEmail } = require('../helpers/isValidEmail');

queryRoutes.post('/firstAppConfig', async (req, res) => {
  const { email, password, specialKeyword } = req.body;

  if (!specialKeyword || specialKeyword !== process.env.JWT_SEED) {
    return res.status(400).send({ message: 'No no no no ... Ojito.' });
  }

  const categories = await Category.insertMany([
    {
      name: 'Bronce',
      value: 'Bronze',
      exchangeType: 'points',
      minPoints: 40,
      maxPoints: 59,
      color: '',
    },
    {
      name: 'Plata',
      value: 'Silver',
      exchangeType: 'points',
      minPoints: 60,
      maxPoints: 74,
      color: '',
    },
    {
      name: 'Oro',
      value: 'Gold',
      exchangeType: 'points',
      minPoints: 75,
      maxPoints: 100,
      color: '',
    },
    /* {
      name: 'Monedas',
      value: 'Coins',
      exchangeType: 'coins',
      color: '',
    }, */
  ]);

  const company = new Company({
    assistance: 20,
    competences: 40,
    objetives: 40,
    categories: categories.map((category) => category._id),
  });

  await company.save();

  const rrhhProfile = {
    label: 'Admin. Recursos Humanos',
    name: 'human-resources-admin',
    permissions: [
      'CREATE_COMMUNICATION',
      'ADMIN_ASSISTANCE',
      'ADMIN_BENEFITS',
      'ADMIN_SEARCHES',
    ],
    forRoles: ['boss', 'employee'],
  };

  const profile = new UserProfile(rrhhProfile);
  const profileDb = await profile.save();

  const superAdmin = {
    name: 'Super',
    lastname: 'Admin',
    email,
    isSuperAdmin: true,
    isAdmin: true,
    isNotEvaluable: true,
    role: 'boss',
    profiles: [profileDb._id],
  };

  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res
      .status(400)
      .send({ message: 'El usuario ya se encuentra registrado' });
  }
  const { name, lastname } = superAdmin;

  const newUser = new User({
    fullname: `${name} ${lastname}`,
    ...superAdmin,
    password: encryptPassword(password),
  });

  /* const userSaved =  */ await newUser.save();

  /* await Channel.insertMany([
    {
      name: 'Recursos Humanos',
      description:
        'Un canal de comunicación dedicado a proveer información vital sobre empleo, cultura organizacional y crecimiento profesional para nuestros colaboradores',
      subscribers: [],
      generalInterest: true,
      createUserId: userSaved._id,
    },
  ]); */

  const appConfig = {
    viewBenefits: true,
    viewSearches: true,
    viewReport: true,
    viewDemands: true,
    viewNineBox: true,
    viewStatistics: true,
    pendingTask: null,
  };

  const appConfigDB = new Config(appConfig);

  await appConfigDB.save();

  res.status(201).send({
    message: 'La configuración inicial se ha realizado correctamente.',
  });
});

queryRoutes.post('/assignGoalsToEveryone', async (_, res) => {
  const users = await User.find({});
  const superAdmin = await User.findOne({ email: 'superadmin@mail.com' });

  for await (const user of users) {
    if (user._id !== superAdmin._id) {
      const newGoal = new Goal({
        title: 'Mock Goal',
        detail: 'Mock Detail',
        toUserId: user._id,
        createUserId: superAdmin._id,
      });
      await newGoal.save();
    }
  }

  res.status(201).send({ message: 'Mock goals created' });
});

queryRoutes.post('/giveGoalsDevolutionToEveryone', async (_, res) => {
  const [goals, evaluation] = await Promise.all([
    Goal.find({ state: 'wip' }),
    Evaluation.findOne({ done: false }),
  ]);

  if (!evaluation) {
    res.status(404).send({
      message: 'There is no open evaluation process.',
    });
  }

  for await (const goal of goals) {
    await Goal.findByIdAndUpdate(goal._id, {
      note: 10,
      comments: 'Devolución mockeada',
      state: 'done',
      evaluationId: evaluation._id,
      evaluationName: evaluation.name,
    });
  }

  res.status(201).send({ message: 'Devolution Mock goals created' });
});

queryRoutes.put('/resetGoals', async (req, res) => {
  const { evaluationId } = req.body;
  await Goal.updateMany(
    { evaluationId },
    {
      note: 0,
      evaluationName: '',
      evaluationId: '',
      processed: false,
      state: 'wip',
      comments: '',
    }
  );

  res.status(201).send({ message: 'Goals reseted' });
});

// Genera y pone en 0 el presentismo, dependiendo de la nota que se le manda por parametro.
// Si mandas 0, busca los que tienen algo y les pone 0, y si mandas por ej 76, busca todos los que esten en 0 y les pone 76
queryRoutes.post('/assignAssitanceToUsers/:note', async (req, res) => {
  const { note } = req.params;

  const users = await User.find({
    isNotEvaluable: false,
    active: true,
    'score.assistance': note > 0 ? 0 : { $gt: 0 },
  });

  for await (const user of users) {
    await User.findByIdAndUpdate(user._id, {
      'score.assistance': note > 0 ? note : 0,
    });
  }
  res.status(201).send({ message: 'Mock Assistance assigned' });
});

//Borra reconocimientos, sus relaciones, notificaciones, solicitudes....
queryRoutes.delete('/deleteAll', verifyToken, async (req, res) => {
  try {
    // Para la migracion
    // await User.deleteMany({});
    // await Category.deleteMany({});
    // await Area.deleteMany({});
    // await Company.deleteMany({});
    // await Benefit.deleteMany({});
    // await UserProfile.deleteMany({});
    //

    await Area.updateMany({
      evaluationCreated: false,
    });
    const company = await Company.findOne({});
    if (company) {
      company.isFirstEvaluation = true;
      await company.save();
    }
    await Demand.deleteMany({});
    await Evaluation.deleteMany({});
    await Goal.deleteMany({});
    await Notification.deleteMany({});
    await Novelty.deleteMany({});
    await Reminder.deleteMany({});
    await Congratulation.deleteMany({});
    await Recognition.deleteMany({});
    await Search.deleteMany({});
    await UserEvaluation.deleteMany({});
    await User.updateMany(
      {},
      {
        $set: {
          recognitions: [],
          postulations: [],
          coins: 0,
          score: {
            objetives: 0,
            competences: 0,
            competencesScores: [],
            assistance: 0,
            totalScore: 0,
          },
          surveysResponses: [],
          previousScores: [],
          actionPlan: {
            viewed: false,
            text: '',
            createUserId: req.user._id,
          },
          previousActionPlans: [],
        },
        evaluationRelationships: {
          confirmed: false,
          affectedUsers: [],
        },
        recognitionsMade: 0,
        developmentHistory: [],
      }
    );
    res.status(200).send({
      message: 'Application data has been reseted',
    });
  } catch (err) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
  }
});

//Borra los datos del usuario relacionados a la empresa, pero NO sus datos personales
queryRoutes.put('/resetUsersData', verifyToken, async (req, res) => {
  try {
    await User.updateMany(
      {},
      {
        $set: {
          area: null,
          // role: 'employee',
          // roleLabel: '',
          range: 1,
          category: 'Bronze',
          recognitions: [],
          postulations: [],
          coins: 0,
          coinsMovements: [],
          score: {
            objetives: 0,
            competences: 0,
            competencesScores: [],
            assistance: 0,
            totalScore: 0,
            evaluationId: '',
            evaluationName: '',
            date: '',
          },
          showSurvey: false,
          surveysResponses: [],
          previousScores: [],
          actionPlan: {
            viewed: false,
            text: '',
            createUserId: req.user._id,
          },
          previousActionPlans: [],
          evaluationRelationships: {
            confirmed: false,
            affectedUsers: [],
          },
          recognitionsMade: 0,
          developmentHistory: [],
          profiles: [],
          mustChangePassword: false,
          isAdmin: false,
        },
      }
    );
    res
      .status(200)
      .send({ message: 'Usuarios reseteados correctamente tras la migración' });
  } catch (e) {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor' });
  }
});

queryRoutes.put('/resetProcessEvaluation', verifyToken, async (_, res) => {
  const company = await Company.findOne({});
  company.isFirstEvaluation = true;
  company.processEvaluations = true;
  await company.save();

  const globalEvaluation = await Evaluation.findOne({
    done: true,
  });

  if (!globalEvaluation) {
    return res.status(404).send({ message: 'No hay Evaluacion Global' });
  }

  globalEvaluation.done = false;
  globalEvaluation?.save();

  await UserEvaluation.updateMany({}, { processed: false });

  await User.updateMany(
    {},
    {
      $set: {
        recognitions: [],
        postulations: [],
        coins: 0,
        score: {
          objetives: 0,
          competences: 0,
          competencesScores: [],
          assistance: 0,
          totalScore: 0,
          evaluationId: null,
          evaluationName: null,
          date: '',
        },
        surveysResponses: [],
        previousScores: [],
      },
    }
  );
  res.status(200).send({
    message: 'Process Evaluation reseted',
  });
});

queryRoutes.put('/setAllUsersActive', async (_, res) => {
  await User.updateMany({ isNotEvaluable: false }, { active: true });

  res.status(200).send({
    message: 'All Users has seted to active',
  });
});

queryRoutes.post('/testEmail/:type', async (req, res) => {
  const { email, name, link } = req.body;
  const { type } = req.params;

  if (isValidEmail(email)) {
    mailer.sendEmail([email], type, { name, link });
  }

  res.status(200).send({
    message: 'Email has been sent.',
  });
});

queryRoutes.post('/completeEvaluations/:managementId', async (req, res) => {
  const { managementId } = req.params;

  let userIds = [];

  const [competences, evaluation, managementArea] = await Promise.all([
    Competence.find({}).limit(5),
    Evaluation.findOne({ done: false }),
    Area.findById(managementId).populate('dependentAreas').lean(),
  ]);

  if (!evaluation) {
    res.status(404).send({
      message: 'There is no open evaluation process.',
    });
  }

  if (!managementArea) {
    res.status(404).send({
      message: 'Area does not exist',
    });
  }

  if (!managementArea.management) {
    res.status(404).send({
      message: 'Area is not management',
    });
  }

  userIds.push(managementArea.bosses[0]);

  for await (const area of managementArea.dependentAreas) {
    if (!area.withoutBoss) {
      userIds = [...userIds, ...area.bosses];
    }
    userIds = [...userIds, ...area.employees];
  }

  await Promise.all([
    UserEvaluation.find({ user: { $in: userIds } })
      .cursor()
      .eachAsync(async (doc) => {
        doc.done = true;
        doc.processed = true;
        await doc.save();
      }),
    User.find({ _id: { $in: userIds } })
      .cursor()
      .eachAsync(async (doc) => {
        if (doc.isActive) {
          doc.score = {
            competences: 80,
            competencesScores: competences.map((competence) => {
              return {
                competenceId: competence._id,
                competencePoints: 80,
              };
            }),
            objetives: 80,
            assistance: 80,
            totalScore: 80,
            evaluationId: evaluation._id,
            evaluationName: evaluation.name,
            date: '2022-11-05',
          };
          await doc.save();
        }
      }),
  ]);

  res.status(200).send({
    message: `Mock evaluations created for area ${managementArea.name}.`,
  });
});

queryRoutes.put('/resetGlobalEvaluation', async (_, res) => {
  const evaluation = await Evaluation.findOneAndUpdate(
    {
      done: false,
    },
    { isCreationEnabled: true },
    { new: true }
  );

  if (!evaluation)
    return res.status(200).send({
      message: 'Global evaluation not found',
    });

  await Promise.all([
    UserEvaluation.deleteMany({ evaluation: evaluation._id }),
    Area.find()
      .cursor()
      .eachAsync(async (doc) => {
        doc.evaluationCreated = false;
        await doc.save();
      }),
    User.find()
      .cursor()
      .eachAsync(async (doc) => {
        doc.evaluationRelationships = {
          confirmed: true,
          affectedUsers: [],
        };
        await doc.save();
      }),
  ]);

  res.status(200).send({
    message: 'Global evaluation was reseted',
  });
});

module.exports = queryRoutes;
