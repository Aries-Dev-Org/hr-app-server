/* eslint-disable no-mixed-operators */
const cron = require('node-cron');
const calculate360 = require('../helpers/calculate360');
const Company = require('../models/Company');
const Evaluation = require('../models/Evaluation');
const Goal = require('../models/Goal');
const User = require('../models/User');
const UserEvaluation = require('../models/UserEvaluation');
const { createNovelty } = require('./noveltyServices');
const { resetAreasEvaluationCreated } = require('./evaluationServices');
const logger = require('./logger');
const Config = require('../models/Config');

const closeEvaluationProcess = (req) => {
  // Obtener la fecha y hora actual
  const now = new Date();

  // Agregar 1 minutos a la hora actual
  now.setMinutes(now.getMinutes() + 1);

  // Obtener los minutos y horas correspondientes
  const minutes = now.getMinutes();
  const hours = now.getHours();

  const schedule = cron.schedule(
    `${minutes} ${hours} * * *`,
    async () => {
      try {
        const lastEvaluation = await getLastEvaluation();
        const company = await Company.findOne({});

        const processUserEvaluations = async (doc) => {
          const finalPonderations = doc.area.hasOwnPonderations
            ? doc.area.ponderations
            : company;
          const finalObjetivesPoints = await calculateObjetivesFinalPoints(
            lastEvaluation,
            doc
          );
          const { competencesScore, competencesScoreDetail, comments } =
            await calculateCompetencesFinalPoints(lastEvaluation, doc, company);
          doc.score.objetives = finalObjetivesPoints;
          doc.score.competences = competencesScore;
          doc.score.competencesScores = competencesScoreDetail.map(
            (scoreDetail) => ({
              competenceId: scoreDetail.competenceId,
              competencePoints: scoreDetail.points,
            })
          );
          doc.score.totalScore = Math.round(
            (finalObjetivesPoints * finalPonderations.objetives) / 100 +
              (competencesScore * finalPonderations.competences) / 100 +
              (doc.score.assistance * finalPonderations.assistance) / 100
          );
          doc.score.evaluationName = lastEvaluation.name;
          doc.score.evaluationId = lastEvaluation._id;
          doc.score.date = lastEvaluation.dateTo;
          doc.score.comments = comments;
          const updatedActionPlans = [
            {
              ...doc.actionPlan,
              evaluationId: lastEvaluation._id,
            },
            ...doc.previousActionPlans,
          ];
          doc.previousActionPlans = updatedActionPlans;

          doc.actionPlan = {
            text: '',
            viewed: false,
            createUserId: req.user._id,
          };
          doc.evaluationProcessed = true;

          await doc.save();
        };

        await User.find({
          active: true,
          isNotEvaluable: false,
          evaluationProcessed: false,
          area: { $exists: true, $ne: null },
        })
          .populate({
            path: 'area',
            select: 'management hasOwnPonderations ponderations',
          })
          .cursor()
          .eachAsync(processUserEvaluations);

        await Goal.updateMany({ processed: false }, { processed: true });
        await Evaluation.findOneAndUpdate(
          { _id: lastEvaluation._id },
          { done: true }
        );
        await resetAreasEvaluationCreated();
        await createNovelty(req, {
          content:
            'Ha finalizado el proceso de evaluación. Ya se encuentran disponibles los resultados.',
        });

        const updatedConfig = await Config.findOneAndUpdate(
          {},
          {
            'pendingTask.success': true,
            'pendingTask.error': false,
            'pendingTask.pending': false,
          },
          { new: true }
        );

        const socket = req.app.get('socket');

        socket.emit(`pending-task-finished-${req.user._id}`, {
          config: updatedConfig,
          model: 'GENERAL_DATA_',
          payload: { evaluation: null },
        });

        schedule.stop();
      } catch (error) {
        logger.error(`[ CLOSE EVALUATION PROCESS ] - ${error.stack}`);

        const updatedConfig = await Config.findOneAndUpdate(
          {},
          {
            'pendingTask.error': true,
            'pendingTask.success': false,
            'pendingTask.pending': false,
          },
          { new: true }
        );

        const socket = req.app.get('socket');

        socket.emit(`pending-task-finished-${req.user._id}`, {
          config: updatedConfig,
          model: 'GENERAL_DATA_',
          payload: {},
        });

        schedule.stop();
      } finally {
        await Config.findOneAndUpdate(
          {},
          {
            pendingTask: null,
          }
        );
      }
    },
    { scheduled: false }
  );

  schedule.start();
};

const getLastEvaluation = async () => {
  const [lastEvaluation] = await Evaluation.find({})
    .sort({
      createdAt: -1,
    })
    .limit(1);

  return lastEvaluation;
};

const calculateCompetencesFinalPoints = async (
  lastEvaluation,
  doc,
  company
) => {
  const relatedEvaluations = await UserEvaluation.find({
    evaluation: lastEvaluation._id,
    'affectedUsers.user': doc._id,
  })
    .select('label user affectedUsers answers')
    .populate({ path: 'user', select: 'fullname role' })
    .lean();

  const { competencesScore, competencesScoreDetail, comments } = calculate360(
    relatedEvaluations,
    String(doc._id),
    company.impacts,
    company.competences
  );

  return { competencesScore, competencesScoreDetail, comments };
};

const calculateObjetivesFinalPoints = async (lastEvaluation, doc) => {
  let sumObjetivesPoints = 0;
  let finalObjetivesPoints = 0;

  const userGoals = await Goal.find({
    evaluationId: lastEvaluation._id.toString(),
    toUserId: doc._id.toString(),
    group: false,
  });

  if (userGoals.length > 0) {
    userGoals.forEach((goal) => {
      const note = goal.note * 10;
      sumObjetivesPoints = sumObjetivesPoints + note;
    });

    finalObjetivesPoints = sumObjetivesPoints / userGoals.length;
  }

  return finalObjetivesPoints;
};

module.exports = closeEvaluationProcess;
