/* eslint-disable no-unused-vars */

const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getGeneralData = async (userId) => {
  const {
    Area,
    User,
    UserProfile,
    Evaluation,
    Competence,
    Config,
    Company,
    CompetencesTemplate,
    UserEvaluation,
  } = getCurrentConnectionModels();

  const applicationName = process.env.APPLICATION_NAME;
  // Usamos Promise.all para hacer todas las consultas en paralelo
  const [
    areas,
    user,
    users,
    userProfiles,
    evaluation,
    competences,
    config,
    company,
    competencesTemplates,
  ] = await Promise.all([
    Area.find({})
      .populate({
        path: 'dependentAreas',
        select: 'name bosses employees withoutBoss evaluationCreated',
      })
      .populate({
        path: 'bosses',
        select: 'fullname email avatar entry roleLabel range active score',
      })
      .populate({
        path: 'employees',
        select: 'fullname email avatar entry roleLabel active score',
      })
      .populate({
        path: 'parentArea',
        select: 'name bosses',
      })
      .sort({ name: 'asc' }),
    User.findById(userId)
      .populate({
        path: 'area',
        populate: [
          {
            path: 'dependentAreas',
            select: 'bosses employees withoutBoss evaluationCreated name',
          },
        ],
      })
      .populate('profiles')
      .populate({ path: 'actionPlan.createUserId', select: 'fullname avatar' })
      .select('-password -createdAt -updatedAt -__v -recognitions -category'),
    User.find({ active: true, isNotEvaluable: false })
      .select('name lastname role area profiles avatar')
      .populate('area')
      .sort({ name: 'asc' }),
    UserProfile.find({}),
    Evaluation.findOne({ done: false }),
    Competence.find({}).sort({ name: 'asc' }),
    Config.findOne({}),
    Company.findOne({}).populate('categories'),
    CompetencesTemplate.find({}).populate('competences'),
  ]);

  let teamUsers = [];

  // Si el usuario logueado es Super admin, se les devuelve los gerentes para poder asignarle objetivos
  if (user.isSuperAdmin) {
    const bossManagements = users.filter((userDB) => {
      if (userDB.role === 'boss' && userDB.area?.management) {
        return userDB;
      }
    });

    teamUsers = [...bossManagements];
  } else {
    // Si el usuario logueado es Jefe
    if (user.role === 'boss') {
      // Se le devuelven sus empleados ...
      const employees = users.filter((employee) =>
        user.area?.employees?.includes(employee._id.toString())
      );
      teamUsers = [...teamUsers, ...employees];

      // Y se le devuelven los jefes de las areas dependientes mas los empleados de las areas dependientes sin jefe
      user.area?.dependentAreas.forEach((dependentArea) => {
        if (dependentArea.withoutBoss) {
          teamUsers = [
            ...teamUsers,
            ...users.filter((userDB) =>
              dependentArea.employees.includes(userDB._id.toString())
            ),
          ];
        } else {
          teamUsers = [
            ...teamUsers,
            ...users.filter((userDB) =>
              dependentArea.bosses.includes(userDB._id.toString())
            ),
          ];
        }
      });
    }
  }

  // Si el usuario no es Super Admin, pero es jefe y hay evaluacion abierta
  if (!user.isSuperAdmin && user.role === 'boss' && evaluation) {
    const dependentAreasWithoutBoss = user.area?.dependentAreas.filter(
      (area) => area.withoutBoss
    );

    // Validamos si falta crear evaluaciones a empleados para su área (siempre y cuando no sea withoutEmployees) o para areas dependientes sin jefe
    evaluation.isCreationEnabled =
      (!user.area.withoutEmployees && !user.area?.evaluationCreated) ||
      dependentAreasWithoutBoss.some((area) => !area.evaluationCreated);
  }

  // por default, no tiene evaluaciones pendientes de hacer, pero si hay evalulacion en curso, me fijo lo sig...
  let pendingEvaluations = false;
  if (evaluation) {
    const userEvaluations = await UserEvaluation.find({
      evaluation: evaluation._id,
      user: userId,
    });

    // Si no tengo evaluaciones creadas para este proceso, o alguna de las creadas no esta terminada, mando true, para ver el otro msg
    if (
      userEvaluations.length === 0 ||
      userEvaluations.some((ev) => ev.done === false)
    ) {
      pendingEvaluations = true;
    }
  }

  return {
    applicationName,
    areas,
    userScore: user.score,
    teamUsers,
    company,
    competences,
    competencesTemplates,
    userProfiles,
    userInfo: user,
    evaluation,
    config,
    floatingReminders: {
      pendingEvaluations,
    },
  };
};
