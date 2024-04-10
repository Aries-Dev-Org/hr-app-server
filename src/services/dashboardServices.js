const { getAllStatus } = require('./companyServices');
const { getOpenPendings, getClosePendings } = require('./evaluationServices');
const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getDashboardData = async (req) => {
  const models = getCurrentConnectionModels();

  const [novelties, reminders, congratulations, categoriesRanking] =
    await Promise.all([
      models.Novelty.find().sort({ createdAt: 'desc' }),
      models.Reminder.find().sort({ date: 'asc' }),
      models.Congratulation.find().sort({ createdAt: 'desc' }),
      models.User.find({
        'score.totalScore': { $gt: 0 },
        active: true,
        isNotEvaluable: false,
      })
        .select('name lastname score avatar')
        .populate('area')
        .sort({ 'score.totalScore': 'desc' })
        .limit(10),
    ]);

  const response = { novelties, reminders, congratulations, categoriesRanking };

  // Si es super admin, agregamos data a la respuesta
  if (req.user.isSuperAdmin) {
    const [evaluation, status] = await Promise.all([
      await models.Evaluation.findOne({ done: false }),
      getAllStatus(models),
    ]);

    response.status = status;

    // Si no hay evaluacion en curso, buscamos los faltantes para abrirla, y armamos una respuesta.
    // Si hay una en curso, hacemos lo mismo pero con los faltantes para cerrarla
    if (evaluation) {
      const closePendings = await getClosePendings(evaluation._id, models);
      const getPending = (key) =>
        closePendings?.areas?.some((area) => area[key]);

      const closePendingTasks = [
        {
          title: 'Cargar presentismos',
          pending: closePendings.hasPendingAssistance,
        },
        {
          title: 'Completar evaluaciones',
          pending: getPending('hasEvaluationsPendingToDo'),
        },
        {
          title: 'Crear evaluaciones para empleados',
          pending: getPending('hasEvaluationsPendingToCreate'),
        },
        {
          title: 'Crear evaluaciones para jefes',
          pending: closePendings.hasEvaluationsPendingToCreate,
        },
        {
          title: 'Dar devolución a objetivos por parte de jefes',
          pending: getPending('hasGoalsPendingToGiveFeedback'),
        },
        {
          title: 'Dar devolución a objetivos por parte del SA',
          pending: closePendings.hasAdminGoalsPendingToGiveFeedback,
        },
      ];

      response.closePendingTasks = closePendingTasks;
    } else {
      const openPendings = await getOpenPendings(models);

      const getPending = (key) =>
        openPendings?.areas?.some((area) => area[key]);
      // const getRate = (key) =>
      //   openPendings.areas.filter((area) => area[key]).length;
      // const areasLength = openPendings.areas.length;

      const openPendingTasks = [
        {
          title: 'Asignación de objetivos de Super Admin',
          pending: openPendings.hasAdminGoalsPendingToAssign,
        },
        {
          title: 'Asignación de objetivos de jefes',
          pending: getPending('hasGoalsPendingToAssign'),
          // rate: `${getRate('hasGoalsPendingToAssign')}/${areasLength}`,
        },
        {
          title: 'Cargar un mínimo de usuarios en areas',
          pending: getPending('hasMissingUsers'),
          // rate: `${getRate('hasMissingUsers')}/${areasLength}`,
        },
        {
          title: 'Asignar relaciones para evaluaciones',
          pending: getPending('hasRelationshipsPendings'),
          // rate: `${getRate('hasRelationshipsPendings')}/${areasLength}`,
        },
      ];

      response.openPendingTasks = openPendingTasks;
    }
  }
  return response;
};
