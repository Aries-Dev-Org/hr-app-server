const cron = require('node-cron');
const { createGlobalEvaluation } = require('./evaluationServices');
const { createNovelty } = require('./noveltyServices');
const logger = require('./logger');
const Config = require('../models/Config');

const openGlobalEvaluationProcess = (req) => {
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
        const evaluation = await createGlobalEvaluation({
          ...req.body,
          createUserId: req.user._id,
        });

        await createNovelty(req, {
          content:
            'Comenzó un nuevo período de Evaluación. Tus puntos y monedas han sido reseteados.',
          redirect: true,
          redirectLabel: 'Ir a Evaluaciones',
          redirectUrl: '/evaluaciones',
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
          payload: { evaluation },
        });

        schedule.stop();
      } catch (error) {
        logger.error(`[ OPEN EVALUATION PROCESS ] - ${error.stack}`);
        schedule.stop();
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
      } finally {
        await Config.findOneAndUpdate(
          {},
          {
            pendingTask: null,
          }
        );
      }
    },
    {
      scheduled: false,
    }
  );

  schedule.start();
};

module.exports = openGlobalEvaluationProcess;
