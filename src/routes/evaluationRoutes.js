/* eslint-disable no-mixed-operators */
const evaluationRoutes = require('express').Router();
const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const path = require('path');
const fs = require('fs-extra');
const Area = require('../models/Area');
const {
  updateEvaluationResponse,
  getResponsesByEvaluationId,
  getUserEvaluations,
  getEvaluationResponse,
  getGlobalEvaluation,
  createUserEvaluations,
  getOpenPendings,
  getClosePendings,
  getRelatedEvaluations,
  getCurrentEvaluationsByUser,
  deleteEvaluations,
  getTeamUsersEvaluations,
  updatePostEvaluationUsersToFalse,
} = require('../services/evaluationServices');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Competence = require('../models/Competence');
const { goalsDevolutions } = require('../helpers/enumGoalsDevolutions');
const { getCompetenceComment } = require('../helpers/getCompetenceComment');
const { getNineboxText } = require('../helpers/getNineBoxTexts');
const Company = require('../models/Company');
const closeEvaluationProcess = require('../services/closeEvaluationProcess');
const openGlobalEvaluationProcess = require('../services/openGlobalEvaluationProcess');
const Config = require('../models/Config');
const { CustomError } = require('../middlewares/expressErrorsHandler');
const { orderById } = require('../helpers/orderById');

evaluationRoutes.get('/impacts/:userId', async (req, res) => {
  const { userId } = req.params;
  const users = await User.find({
    'evaluationRelationships.affectedUsers.user': userId,
  }).lean();

  const evaluationsImpacts = [];

  users.forEach((user) => {
    const currentImpact = user.evaluationRelationships.affectedUsers.find(
      (data) => String(data.user) === userId
    );
    evaluationsImpacts.push(currentImpact);
  });
  res.status(200).send(evaluationsImpacts);
});

// Crear Evaluación Global
evaluationRoutes.post('/', async (req, res) => {
  const currentConfig = await Config.findOne({}).lean();
  if (currentConfig?.pendingTask) {
    throw new CustomError('Esta proceso ya se encuentra en curso', 400);
  }

  openGlobalEvaluationProcess(req);

  const updatedConfig = await Config.findOneAndUpdate(
    {},
    {
      pendingTask: {
        pending: true,
        title: 'Apertura del proceso de evaluaciones',
        success: false,
        error: false,
      },
    },
    { new: true }
  );

  res.status(200).send({
    payload: { config: updatedConfig },
    message: 'Se está se abriendo el proceso de evaluaciones',
  });
});

// Crear Evaluación para Usuarios
evaluationRoutes.post('/user', async (req, res) => {
  const { forRole } = req.query;
  const { evaluation: evaluationId, competences, areas } = req.body;
  await createUserEvaluations(
    req,
    evaluationId,
    competences,
    req.user._id,
    areas
  );

  const evaluation = await getGlobalEvaluation(forRole, req.user.area?._id);

  if (!req.user.isSuperAdmin) {
    const userArea = await Area.findById(req.user.area?._id).populate(
      'dependentAreas'
    );
    const dependentAreasWithoutBoss = userArea.dependentAreas.filter(
      (area) => area.withoutBoss
    );

    // Validamos si falta crear evaluaciones a empleados para su área (siempre y cuando no sea withoutEmployees) o para areas dependientes sin jefe
    evaluation.isCreationEnabled =
      (!userArea.withoutEmployees && !userArea.evaluationCreated) ||
      dependentAreasWithoutBoss.some((area) => !area.evaluationCreated);
  }

  const updatedAreas = await Area.find({})
    .populate({
      path: 'dependentAreas',
      select: 'name bosses employees withoutBoss evaluationCreated',
    })
    .populate({
      path: 'bosses',
      select: 'fullname email avatar entry roleLabel range active',
    })
    .populate({
      path: 'employees',
      select: 'fullname email avatar entry roleLabel active',
    })
    .populate({
      path: 'parentArea',
      select: 'name bosses',
    })
    .sort({ name: 'asc' });

  res.status(200).send({
    message: 'Evaluaciones creadas correctamente.',
    payload: { evaluation, areas: updatedAreas },
  });
});

// Obtener las evaluaciones del usuario ( y la de los empleados si el usuario es jefe)
evaluationRoutes.get('/user/:userId', async (req, res) => {
  const { evaluation, userEvaluations } = await getUserEvaluations(
    req.params.userId
  );

  let teamUsersEvaluations = [];

  if (evaluation && req.user.role === 'boss' && req.user.area) {
    const area = await Area.findById(req.user.area._id).populate([
      {
        path: 'employees',
        select: 'fullname avatar role',
        populate: { path: 'area', select: 'name' },
      },
      {
        path: 'bosses',
        select: 'fullname avatar role',
        populate: { path: 'area', select: 'name' },
      },
      {
        path: 'dependentAreas',
        populate: [
          {
            path: 'employees',
            select: 'fullname avatar role',
            populate: { path: 'area', select: 'name' },
          },
        ],
      },
    ]);

    teamUsersEvaluations = await getTeamUsersEvaluations(
      req.user._id.toString(),
      area,
      evaluation._id
    );
  }

  res.status(200).send({
    evaluation,
    userEvaluations,
    teamUsersEvaluations,
  });
});

// Obtener una respuesta de una evaluacion del usuario
evaluationRoutes.get('/response/:userEvaluationId', async (req, res) => {
  const { evaluationResponse, users } = await getEvaluationResponse(
    req.params.userEvaluationId
  );

  evaluationResponse.competences = evaluationResponse.competences.map(
    (competence) => {
      const behaviourQuestionOptionsSorted =
        competence.behaviourQuestionOptions.sort(() => Math.random() - 0.5);

      return {
        ...competence,
        behaviourQuestionOptions: behaviourQuestionOptionsSorted,
      };
    }
  );
  res.status(200).send({ evaluationResponse, users });
});

// Actualizar una respuesta del usuario por id
evaluationRoutes.put('/response/:userEvaluationId', async (req, res) => {
  const userEvaluation = await updateEvaluationResponse(
    req.params.userEvaluationId,
    req.body
  );
  await updatePostEvaluationUsersToFalse(userEvaluation);

  res
    .status(201)
    .send({ payload: {}, message: 'Evaluación enviada correctamente' });
});

// Obtener las respustas para una evaluación
evaluationRoutes.get('/:id/response', async (req, res) => {
  const evaluationResponses = await getResponsesByEvaluationId.find(
    req.params.id
  );

  if (!evaluationResponses)
    return res.status(404).send({ message: 'La evaluación no existe' });

  res.status(200).send(evaluationResponses);
});

// Cerrar el proceso de evaluacion
evaluationRoutes.put('/close-evaluation-process', async (req, res) => {
  const currentConfig = await Config.findOne({}).lean();
  if (currentConfig?.pendingTask) {
    throw new CustomError('Esta proceso ya se encuentra en curso', 400);
  }

  closeEvaluationProcess(req);

  const updatedConfig = await Config.findOneAndUpdate(
    {},
    {
      pendingTask: {
        pending: true,
        title: 'Cierre del proceso de evaluaciones',
        success: false,
        error: false,
      },
    },
    { new: true }
  );

  res.status(201).send({
    payload: { config: updatedConfig },
    message:
      'Se está cerrando el proceso de evaluación y se están procesando los resultados.',
  });
});

// Generar informe en pdf
evaluationRoutes.post('/report', async (req, res) => {
  const { score, userId } = req.body;

  // Primero se obtienen todos los datos necesarios para generar las variables del template
  const compentencesIds = score.competencesScores.map(
    (competence) => competence.competenceId
  );

  const [user, goals, competences, company] = await Promise.all([
    User.findById(userId).populate('area').lean(),
    Goal.find({
      toUserId: userId,
      evaluationId: score.evaluationId,
    }).lean(),
    Competence.find({
      _id: { $in: compentencesIds },
    }).lean(),
    Company.findOne({}).populate('categories'),
  ]);

  const orderedCompetences = competences.sort((a, b) =>
    orderById(compentencesIds, a, b)
  );

  const gold = company.categories.find((category) => category.value === 'Gold');
  const silver = company.categories.find(
    (category) => category.value === 'Silver'
  );
  const bronze = company.categories.find(
    (category) => category.value === 'Bronze'
  );

  const competencesWidthPoints = orderedCompetences.map((competence, i) => {
    const points = score.competencesScores[i].competencePoints;
    return {
      ...competence,
      points,
      comment: getCompetenceComment(competence, points, gold, silver, bronze),
    };
  });

  const nineboxText = getNineboxText(
    score.competences,
    score.objetives,
    user.fullname
  );

  const showAssitance =
    !user.area.hasOwnPonderations || user.area.ponderations.assistance > 0;

  // Comienza la generación del PDF
  (async () => {
    try {
      const filePath = path.join(
        __dirname,
        '../pdf-templates/report',
        'index.hbs'
      );

      // Se lee el archivo del template
      const template = await fs.readFile(filePath, 'utf-8');

      // Se registran todos los helpers para usarlos con hb
      hbs.registerHelper('round', function (number) {
        return Math.round(number);
      });

      hbs.registerHelper('getColor', function (number) {
        if (number >= gold.minPoints) return '#6CC20B';
        if (number >= silver.minPoints) return '#B7C20B';
        if (number >= bronze.minPoints) return '#C2A10B';
        return '#C26F0B';
      });

      hbs.registerHelper('getGoalColor', function (result) {
        if (result === 'failed') {
          return '#C26F0B';
        } else {
          return '#6CC20B';
        }
      });

      hbs.registerHelper('competencePercentage', function (points) {
        return Math.round(points);
      });

      hbs.registerHelper('goalStatus', function (note) {
        return note > 5 ? 'Cumplido' : 'No cumplido';
      });

      hbs.registerHelper('goalDevolution', function (note) {
        return goalsDevolutions[note];
      });

      // Se compila el template con las variables
      const content = hbs.compile(template)({
        user,
        score,
        competences: competencesWidthPoints,
        goals,
        nineboxText,
        showAssitance,
      });

      // Se lanza el browser, se carga el template, y se genera el PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await page.setContent(content);

      const pdfBuffer = await page.pdf({
        format: 'a4',
        printBackground: true,
      });

      await browser.close();

      res.set('Content-Type', 'application/pdf');
      res.status(201).send(Buffer.from(pdfBuffer, 'binary'));
    } catch (err) {
      //console.log(err);
    }
  })();
});

// Obtener objetivos pendientes de asignar
evaluationRoutes.get('/pending/open', async (req, res) => {
  const result = await getOpenPendings();
  res.status(200).send({ pendingTasksToOpen: result });
});

// Obtener evaluaciones, objetivos y asistencias pendientes
evaluationRoutes.get('/pending/close/:evaluationId', async (req, res) => {
  const result = await getClosePendings(req.params.evaluationId);
  res.status(200).send({ pendingTasksToClose: result });
});

// Obtener evaluaciones relacionadas a un usuario
evaluationRoutes.get(
  '/calculate360/:evaluationId/:userId',
  async (req, res) => {
    const { evaluationId, userId } = req.params;
    const result = await getRelatedEvaluations(evaluationId, userId);
    res.status(200).send(result);
  }
);

evaluationRoutes.post(
  '/calculate360/:evaluationId/:userId',
  async (req, res) => {
    const { evaluationId, userId } = req.params;
    const { evaluationIds } = req.body;
    await deleteEvaluations(evaluationIds);
    const result = await getRelatedEvaluations(evaluationId, userId);
    res
      .status(200)
      .send({ payload: result, message: 'Las Evaluaciones furon eliminadas' });
  }
);

evaluationRoutes.get('/current/:evaluationId/:userId', async (req, res) => {
  const { evaluationId, userId } = req.params;
  const { user, currentEvaluations } = await getCurrentEvaluationsByUser(
    evaluationId,
    userId
  );
  res.status(200).send({ user, currentEvaluations });
});

evaluationRoutes.post('/current/:evaluationId/:userId', async (req, res) => {
  const { evaluationId, userId } = req.params;
  const { evaluationIds } = req.body;
  await deleteEvaluations(evaluationIds);
  const { user, currentEvaluations } = await getCurrentEvaluationsByUser(
    evaluationId,
    userId
  );
  res.status(200).send({
    payload: { user, currentEvaluations },
    message: 'Las evaluacinoes fueron eliminadas',
  });
});

module.exports = evaluationRoutes;
