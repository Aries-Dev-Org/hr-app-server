/* eslint-disable max-lines */
// const fs = require('fs');
const Area = require('../models/Area');
const Company = require('../models/Company');
const Competence = require('../models/Competence');
const Evaluation = require('../models/Evaluation');
const Goal = require('../models/Goal');
const User = require('../models/User');
const Benefit = require('../models/Benefit');
const UserEvaluation = require('../models/UserEvaluation');
const calculate360Old = require('../helpers/calculate360-old');
const moment = require('moment');
const { CustomError } = require('../middlewares/expressErrorsHandler');
const { mergeCompetencesScores } = require('../helpers/mergeCompetencesScores');
const { isValidEmail } = require('../helpers/isValidEmail');
const MongoClient = require('mongodb').MongoClient;
const mailer = require('../services/mailer');
const { EVALUATION } = require('../constants/notificationTypes');
const calculate360 = require('../helpers/calculate360');
const { sendNotification } = require('../services/notificationServices');
const {
  NEW_EVALUATION,
  ADD_USER_TO_EVALUATION,
} = require('../constants/notificationSubTypes');
const { bossEvaluationTypes } = require('../constants/bossEvaluationTypes');

module.exports.getCompetences = async () => {
  const competences = await Competence.find({});
  return competences;
};

module.exports.createGlobalEvaluation = async (data) => {
  const evaluation = await Evaluation.findOne({ done: false });
  if (evaluation) {
    throw new CustomError('Ya existe una evaluación global creada', 400);
  }

  const client = new MongoClient(process.env.MONGO_DB);
  const session = client.startSession();
  await client.connect();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };

  let newEvaluationSaved;

  try {
    await session.withTransaction(async () => {
      const newEvaluation = new Evaluation(data);
      newEvaluationSaved = await newEvaluation.save({ session });
      await resetBenefitApplicants(session);
      await resetUserScoresAndEvaluationProcessedProp(session);
      await linkEvaluationToGoals(newEvaluationSaved, session); // vincula la evaluacion recien creada a los objetivos previamente puntuados ( en caso de que haya)
    }, transactionOptions);
    await session.commitTransaction();
  } catch (error) {
    throw new CustomError(
      'No pudo completarse la creación del proceso de evaluación.',
      500
    );
  } finally {
    session.endSession();
  }

  return newEvaluationSaved;
};

const resetBenefitApplicants = async (session) => {
  await Benefit.updateMany({}, { applicants: [] }, { session });
};

const resetUserScoresAndEvaluationProcessedProp = async (session) => {
  const company = await Company.findOne({});
  const [previousEvaluation] = await Evaluation.find({ done: true })
    .sort({
      createdAt: -1,
    })
    .limit(1);

  await User.find({ active: true, isNotEvaluable: false })
    .cursor()
    .eachAsync(async (doc) => {
      if (!company.isFirstEvaluation) {
        const previousScores = [
          {
            ...doc.score,
            evaluationName: previousEvaluation.name,
            evaluationId: previousEvaluation._id,
            date: previousEvaluation.dateTo,
          },
          ...doc.previousScores,
        ];
        doc.previousScores = previousScores;
      }
      doc.score = {
        objetives: 0,
        competences: 0,
        competencesScores: [],
        assistance: 0,
        totalScore: 0,
        evaluationId: '',
        evaluationName: '',
        date: '',
      };
      doc.coins = 0;
      doc.coinsMovements = [];
      doc.evaluationProcessed = false;

      await doc.save({ session });
      if (isValidEmail(doc.email)) {
        mailer.sendEmail([doc.email], NEW_EVALUATION, {
          name: doc.fullname,
          link: 'evaluaciones',
        });
      }
    });

  if (company.isFirstEvaluation) {
    company.isFirstEvaluation = false;
    await company.save({ session });
  }
};

const linkEvaluationToGoals = async (evaluation, session) => {
  await Goal.updateMany(
    { processed: false },
    {
      evaluationName: evaluation.name,
      evaluationId: evaluation._id,
      date: evaluation.dateTo,
    },
    { session }
  );
};

module.exports.resetAreasEvaluationCreated = async () => {
  await Area.find({ management: false })
    .cursor()
    .eachAsync(async (doc) => {
      doc.evaluationCreated = false;
      await doc.save();
    });
};

module.exports.getGlobalEvaluation = async (forRole, areaId) => {
  // Este servicio solamente es usado luego de crear una evaluación, para jefes o para empleados
  const evaluation = await Evaluation.findOne({ done: false });

  // Si existe la evaluación se verifica si hay que sobreescribir el isCreationEnabled
  // Este valor define si los usuarios habilitados a crear evaluaciones, aún pueden hacerlo
  if (evaluation) {
    let isCreationEnabled;

    // Si se creó una evaluación para jefes, directamente se toma el valor de la evaluación global
    if (forRole === 'boss') {
      isCreationEnabled = evaluation.isCreationEnabled;
    } else {
      // Si se creó una evaluación para empleados, hay que hacer otras validaciones
      const currentArea = await Area.findById(areaId).populate({
        path: 'dependentAreas',
        select: 'withoutBoss evaluationCreated',
      });

      // Si el que la creó es un jefe de área común
      if (!currentArea.management) {
        // Tomamos el valor de su área.
        // Este valor fué modificado en el momento de crear las evaluaciones
        isCreationEnabled = !currentArea.evaluationCreated;
      } else {
        // Tomamos el valor de sus áreas dependientes, sin jefe.
        // Este valor fué modificado en el momento de crear la/las evaluaciones
        const areasWithoutBoss = currentArea.dependentAreas.filter(
          (area) => area.withoutBoss
        );

        // Verificamos si alguna de estas áreas tiene evaluaciones pendientes por crear
        const evaluationsPendingToCreate = areasWithoutBoss.some(
          (area) => !area.evaluationCreated
        );

        isCreationEnabled = evaluationsPendingToCreate;
      }
    }
    return { ...evaluation._doc, isCreationEnabled };
  } else {
    return null;
  }
};

module.exports.verifyCreationEnabled = async (evaluationId, userId) => {
  const evaluation = await UserEvaluation.findOne({
    evaluation: evaluationId,
    createUserId: userId,
  });
  return Boolean(!evaluation);
};

module.exports.createUserEvaluations = async (
  req,
  evaluationId,
  competences,
  createUserId,
  areas
) => {
  const userCreator = await User.findById(createUserId).populate('area');

  if (userCreator.isSuperAdmin) {
    await createEvaluationsForBosses(
      req,
      evaluationId,
      competences,
      createUserId
    );
  } else {
    await createEvaluationsForEmployees(
      req,
      evaluationId,
      competences,
      createUserId,
      areas
    );
  }
};

const createEvaluationsForBosses = async (
  req,
  evaluationId,
  competences,
  createUserId
) => {
  const users = await User.find({
    active: true,
    isNotEvaluable: false,
  });

  const bossEvaluationsToCreate = [];

  users?.forEach((user) => {
    const affectedUsers = user?.evaluationRelationships?.affectedUsers.filter(
      (evaluation) => evaluation.forRole === 'boss' && evaluation.selected
    );

    if (affectedUsers?.length > 0) {
      // Para todos los usuarios que tengan Jefes para evaluar
      bossEvaluationsToCreate.push({
        label: 'Evaluación a Jefes',
        evaluation: evaluationId,
        competences,
        affectedUsers,
        user: user._id,
        createUserId,
      });
    }

    if (user.role === 'boss') {
      // y Autoevaluación para jefes
      bossEvaluationsToCreate.push({
        label: 'Autoevaluación',
        isSelfEvaluation: true,
        evaluation: evaluationId,
        competences,
        affectedUsers: [
          {
            forRole: 'boss',
            evaluationType: 'SELF',
            user: user._id,
            isAddedUser: false,
            reason: '',
          },
        ],
        user: user._id,
        createUserId,
      });
    }
  });

  // Finalmente se crean las evaluaciones para jefes de una sola vez
  await UserEvaluation.insertMany(bossEvaluationsToCreate);

  // Se envía una notificación para cada usuario al que se le crearon evaluaciones
  const notifiedUsers = [];
  bossEvaluationsToCreate.forEach((userEvaluation) => {
    const notified = notifiedUsers.find((user) => user === userEvaluation.user);
    if (!notified) {
      sendNotification(req, userEvaluation.user, EVALUATION, NEW_EVALUATION);
      notifiedUsers.push(userEvaluation.user);
    }
  });

  // Se actualiza isCreationEnabled para evitar creacion duplicada
  // de evaluaciones para jefes para esta evaluacion global
  await Evaluation.findByIdAndUpdate(evaluationId, {
    isCreationEnabled: false,
  });
};

const createEvaluationsForEmployees = async (
  req,
  evaluationId,
  competences,
  createUserId,
  areas
) => {
  let employeeEvaluationsToCreate = [];
  // va a buscar todas la/las areas que se seleccionaron para crear la evaluacion
  for (const areaId of areas) {
    // Por cada area que mapea arma un array con los empleados a los que se le creara la evaluacion
    employeeEvaluationsToCreate = [];

    const currentArea = await Area.findById(areaId)
      .populate({ path: 'bosses' })
      .populate({ path: 'employees' })
      .populate({
        path: 'parentArea',
        populate: [
          {
            path: 'bosses',
            select: 'evaluationRelationships',
          },
        ],
      });

    let currentAffectedUsers;

    // Si el area tiene jefes
    if (!currentArea.withoutBoss) {
      // por cada jefe se le crean las evaluaciones para los empleados que se tiene en las relaciones
      // y que pertenecen al area para la cual se estan creando las evaluaciones
      currentArea.bosses?.forEach((boss) => {
        currentAffectedUsers =
          boss?.evaluationRelationships?.affectedUsers.filter(
            (evaluation) =>
              evaluation.forRole === 'employee' &&
              evaluation.userArea.toString() === currentArea._id.toString() &&
              evaluation.selected
          );

        // TODO Mejorar
        if (currentAffectedUsers?.length > 0) {
          employeeEvaluationsToCreate.push({
            label: 'Evaluación a Empleados',
            isSelfEvaluation: false,
            evaluation: evaluationId,
            competences,
            affectedUsers: currentAffectedUsers,
            user: boss._id,
            withBonusPoint: true,
            areaName: currentArea.name,
            isMultiple: true,
            createUserId,
          });
        }
      });
    } else {
      // si el area no tiene jefes
      // creamos evaluaciones para cada jefe
      // y tomamos de sus relaciones a los empleados que pertenecen area para la cual se esta creando las evaluaciones
      currentArea.parentArea.bosses?.forEach((boss) => {
        currentAffectedUsers =
          boss?.evaluationRelationships?.affectedUsers.filter(
            (evaluation) =>
              evaluation.forRole === 'employee' &&
              evaluation.userArea.toString() === currentArea._id.toString() &&
              evaluation.selected
          );

        // TODO Mejorar
        if (currentAffectedUsers?.length > 0) {
          employeeEvaluationsToCreate.push({
            label: 'Evaluación a Empleados',
            isSelfEvaluation: false,
            evaluation: evaluationId,
            competences,
            affectedUsers: currentAffectedUsers,
            user: boss._id,
            withBonusPoint: true,
            areaName: currentArea.name,
            isMultiple: true,
            createUserId,
          });
        }
      });
    }

    currentArea.employees?.forEach((employee) => {
      const affectedUsers =
        employee?.evaluationRelationships?.affectedUsers.filter(
          (evaluation) =>
            evaluation.forRole === 'employee' &&
            !evaluation.isAddedUser &&
            evaluation.selected
        );

      if (affectedUsers?.length > 0) {
        employeeEvaluationsToCreate.push({
          label: 'Evaluación a Pares',
          isSelfEvaluation: false,
          evaluation: evaluationId,
          competences,
          affectedUsers,
          user: employee._id,
          createUserId,
        });
      }

      // Evaluamos si alguno de los affectdUsers relacionados es de otra area (isAddedUser)
      // En el caso de que haya, le creamos la evaluación al affectedUser hacia el empleado que estamos mapeando,
      // que va a ser con las competencias que fueron seleccionadas por el jefe de esta area.
      const affectedAddedUsers =
        employee?.evaluationRelationships?.affectedUsers.filter(
          (evaluation) =>
            evaluation.forRole === 'employee' &&
            evaluation.isAddedUser &&
            evaluation.selected
        );

      if (affectedAddedUsers?.length > 0) {
        affectedAddedUsers.forEach((affectedAddedUser) => {
          employeeEvaluationsToCreate.push({
            label: 'Empleado de otra área',
            isSelfEvaluation: false,
            evaluation: evaluationId,
            competences,
            affectedUsers: [
              {
                forRole: 'employee',
                evaluationType: 'EMPLOYEE_PAIR',
                user: employee._id,
                isAddedUser: true,
                reason: '',
              },
            ],
            areaName: currentArea.name,
            user: affectedAddedUser.user,
            createUserId,
            isMultiple: true,
          });
        });
      }

      employeeEvaluationsToCreate.push({
        label: 'Autoevaluación',
        isSelfEvaluation: true,
        evaluation: evaluationId,
        competences,
        affectedUsers: [
          {
            forRole: 'employee',
            evaluationType: 'SELF',
            user: employee._id,
            isAddedUser: false,
            reason: '',
          },
        ],
        user: employee._id,
        createUserId,
      });
    });

    // Marcamos que se ya se creó la evaluación para empleados en esta área
    // Luego, para el usuario creador, se sobreescribirá isCreationEnabled en la evaluación global con estos valores
    // Por cada área dependiente sin jefe y para su propia area
    currentArea.evaluationCreated = true;
    await currentArea.save();
    // Finalmente se crean las evaluaciones para empleados de el area que se mapea
    await UserEvaluation.insertMany(employeeEvaluationsToCreate);
  }

  // Se envía una notificación para cada usuario al que se le crearon evaluaciones
  const notifiedUsers = [];
  employeeEvaluationsToCreate.forEach((userEvaluation) => {
    const notified = notifiedUsers.find((user) => user === userEvaluation.user);
    if (!notified) {
      sendNotification(req, userEvaluation.user, EVALUATION, NEW_EVALUATION);
      notifiedUsers.push(userEvaluation.user);
    }
  });
};

module.exports.getUserEvaluations = async (userId) => {
  const evaluation = await Evaluation.findOne({ done: false }).select(
    'name dateTo'
  );

  if (!evaluation) {
    return { evaluation: null, userEvaluations: [] };
  }

  const userEvaluations = await UserEvaluation.find({
    user: userId,
    evaluation: evaluation._id,
  }).populate('competences');

  return { evaluation, userEvaluations };
};

module.exports.getTeamUsersEvaluations = async (userId, area, evaluationId) => {
  const teamUsersEvaluations = [];
  const dependentEmployees = [];

  area.dependentAreas.forEach(
    (depArea) =>
      depArea.withoutBoss && dependentEmployees.push(...depArea.employees)
  );

  const allRelatedUsers = [
    ...area.bosses.filter((boss) => boss._id.toString() !== userId),
    ...area.employees,
    ...dependentEmployees,
  ];

  const userEvaluations = await UserEvaluation.find({
    evaluation: evaluationId,
    user: { $in: allRelatedUsers.map((user) => user._id) },
  }).select('label done user');

  allRelatedUsers.forEach((user) => {
    const evaluationsByUser = {};
    evaluationsByUser.user = user;
    evaluationsByUser.evaluations = userEvaluations.filter(
      (evaluation) => String(evaluation.user) === String(user._id)
    );
    teamUsersEvaluations.push(evaluationsByUser);
  });

  return teamUsersEvaluations;
};

module.exports.getEvaluationResponse = async (userEvaluationId) => {
  const evaluationResponse = await UserEvaluation.findById(userEvaluationId)
    .populate({
      path: 'affectedUsers.user',
      select: 'fullname avatar',
    })
    .populate('competences');

  return { evaluationResponse };
};

module.exports.updateEvaluationResponse = async (userEvaluationId, answers) => {
  return await UserEvaluation.findByIdAndUpdate(
    userEvaluationId,
    {
      done: true,
      reOpen: false,
      dateCompleted: moment().format('YYYY-MM-DD'),
      answers,
    },
    { new: true }
  );
};

module.exports.updatePostEvaluationUsersToFalse = async (userEvaluation) => {
  const userId = userEvaluation.user;
  const affectedUsersIds = userEvaluation.affectedUsers.map((aff) =>
    aff.user.toString()
  );

  await User.findById(userId)
    .cursor()
    .eachAsync(async (doc) => {
      const newEvaluationRelationships = {
        ...doc.evaluationRelationships,
        affectedUsers: doc.evaluationRelationships.affectedUsers.map((aff) => {
          if (affectedUsersIds.includes(aff.user.toString())) {
            return {
              ...aff._doc,
              postEvaluation: false,
            };
          }
          return aff;
        }),
      };
      doc.evaluationRelationships = newEvaluationRelationships;
      doc.save();
    });

  const newAffectedUsers = userEvaluation.affectedUsers.map((aff) => ({
    ...aff._doc,
    postEvaluation: false,
  }));

  await UserEvaluation.findByIdAndUpdate(userEvaluation._id, {
    affectedUsers: newAffectedUsers,
  });
};

module.exports.updateScores = async (
  data,
  evaluationId,
  evaluationName,
  dateTo
) => {
  const affectedUsersPoints = calculate360Old(data);

  const company = await Company.findOne({});

  for await (const data of affectedUsersPoints) {
    const { userId, points, coins, competencesScores, newComment } = data;

    const userDB = await User.findById(userId).populate('area');

    const competencePonderation = userDB.area.hasOwnPonderations
      ? userDB.area.ponderations.competences
      : company.competences;

    // 1.25 representa 100 (el total en porcentaje) dividido por 80 (el total de puntos posibles)
    const newAddingScore = points * 1.25;
    const newAddingTotalScore = newAddingScore * (competencePonderation / 100);

    const newcompetencesScores = mergeCompetencesScores(
      userDB._doc,
      competencesScores
    );

    const coinsMovement = {
      date: new Date(),
      operation: 'Punto Bonus',
      qty: coins,
    };

    const updatedScoreAndCoins = {
      score: {
        objetives: userDB.score.objetives,
        assistance: userDB.score.assistance,
        competences: userDB.score.competences + newAddingScore,
        competencesScores: newcompetencesScores,
        totalScore: userDB.score.totalScore + newAddingTotalScore,
        comments: newComment
          ? [...userDB.score.comments, newComment]
          : userDB.score.comments,
        evaluationId,
        evaluationName,
        date: dateTo,
      },
      coins: userDB.coins + coins,
    };

    if (coins > 0) {
      await User.findByIdAndUpdate(userId, {
        $set: updatedScoreAndCoins,
        $push: { coinsMovements: coinsMovement },
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: updatedScoreAndCoins,
      });
    }
  }

  return 'Scores Updated';
};

module.exports.getOpenPendings = async (models) => {
  // Obtenemos de una sola vez las areas gerenciales y sus areas dependientes y los objetivos en curso
  const [areas, goals] = await Promise.all([
    models.Area.find()
      .populate([
        { path: 'bosses', select: 'fullname email evaluationRelationships' },
        { path: 'employees', select: 'fullname email evaluationRelationships' },
      ])
      .sort({ name: 'asc' })
      .lean(),
    models.Goal.find({
      processed: false,
      group: false,
    })
      .select('toUserId state')
      .lean(),
  ]);

  // Funcion para evaluar si un area tiene objetivos pendientes de asignar
  // En el caso del super admin, no recibe area
  const evaluateGoalsPendingToAssign = (area = null) => {
    // Variable que contiene el valor que se va a retornar finalmente
    let hasPendings = false;

    // Funcion para evaluar si un grupo de usuarios tienen objetivos pendientes de asignar
    const hasGoalsPendings = (users) => {
      users?.forEach((user) => {
        // Solo continuamos evaluando si el valor a retornar sigue siendo falso
        if (!hasPendings) {
          hasPendings = !goals.some(
            (goal) => goal.toUserId?.toString() === user._id.toString()
          );
        }
      });
    };

    // Variable donde se van a incluir los miembros del equipo segun el caso
    let teamUsers = [];

    if (area) {
      // se validan faltantes de un area cualquiera
      // se agrega a sus empleados
      teamUsers = area.employees;

      // Se le agregan los jefes de las areas dependientes y si son sin jefe, se le agregan los empleados de esas areas
      area.dependentAreas?.forEach((dependentAreaId) => {
        const currentArea = areas.find(
          (mappedArea) =>
            mappedArea._id.toString() === dependentAreaId.toString()
        );
        if (currentArea.withoutBoss) {
          teamUsers = [...teamUsers, ...currentArea.employees];
        } else {
          teamUsers = [...teamUsers, ...currentArea.bosses];
        }
      });
    } else {
      // Si no se pasa area, es porque se valida para el super admin y los miembros son los gerentes
      areas?.forEach((area) => {
        if (area.management) {
          teamUsers = [...teamUsers, ...area.bosses];
        }
      });
    }

    // Si no hay usuarios en el area se devuelve directamente true
    if (teamUsers?.length === 0) return false;

    // Se llama a la funcion que evalua para los usuarios correspondientes, si hay objetivos pendientes de asignar
    hasGoalsPendings(teamUsers);

    return hasPendings;
  };

  // Evalúa si no hay al menos un usuario cargado en un area dependiendo de los casos
  const evaluateMissingUsers = (area) => {
    if (area.management) {
      // Que la gerencia no tenga jefe
      return area.bosses?.length === 0;
    } else {
      if (area.withoutBoss) {
        // Que un area sin jefe no tenga empleados
        return area.employees?.length === 0;
      } else if (area.withoutEmployees) {
        // Que un area sin empleados no tenga jefes
        return area.bosses?.length === 0;
      } else {
        // Que un area comun con jefe no tenga jefes o no tenga empleados
        return area.bosses?.length === 0 || area.employees?.length === 0;
      }
    }
  };

  const getUsersInCharge = (area) => {
    if (area.withoutBoss) {
      const parentArea = areas.find(
        (mappedArea) =>
          mappedArea._id.toString() === area.parentArea?.toString()
      );
      return parentArea ? parentArea.bosses : [];
    } else {
      return area.bosses;
    }
  };

  // Evalúa si se confirmaron las relaciones de evaluaciones para todos los usuarios y que al menos tengan 1 usuario seleccionado
  const getRelationshipsPendings = (area) => {
    return (
      area.bosses.some(
        (boss) =>
          !boss.evaluationRelationships.confirmed ||
          !boss.evaluationRelationships.affectedUsers.some(
            (user) => user.selected
          )
      ) ||
      area.employees.some(
        (employee) =>
          !employee.evaluationRelationships.confirmed ||
          !employee.evaluationRelationships.affectedUsers.some(
            (user) => user.selected
          )
      )
    );
  };

  // Se construye el objeto con el resultado que se retorna
  const result = {
    hasAdminGoalsPendingToAssign: evaluateGoalsPendingToAssign(),
    areas: areas.map((area) => {
      return {
        _id: area._id,
        name: area.name,
        usersInCharge: getUsersInCharge(area),
        hasGoalsPendingToAssign: evaluateGoalsPendingToAssign(area),
        hasMissingUsers: evaluateMissingUsers(area),
        hasRelationshipsPendings: getRelationshipsPendings(area),
      };
    }),
    isOpenActionEnabled: false,
  };

  // Funcion que recorre el resultado y evalua si está habilitada la creación de la Eval. global
  const evaluateGlobalEvaluationCreationEnabled = () => {
    // Variable con el valor a retornar. Se toma como primer valor los pendientes del super admin
    let enabled = !result.hasAdminGoalsPendingToAssign;

    // Si el valor a retornar es verdadero seguimos recorriendo el objeto
    // Si en algun momento llega a ser falso, no nos interesa seguir evaluando
    if (enabled) {
      result.areas?.forEach((area) => {
        // Solo continuamos evaluando si el valor a retornar sigue siendo verdadero
        if (enabled) {
          enabled =
            !area.hasGoalsPendingToAssign &&
            !area.hasMissingUsers &&
            !area.hasRelationshipsPendings;
        }
      });
    }
    return enabled;
  };

  // Se pasa el valor que retorna la anterior funcion a la prop correspondiente del objeto resultado
  result.isOpenActionEnabled = evaluateGlobalEvaluationCreationEnabled();

  return result;
};

module.exports.getClosePendings = async (evaluationId, models) => {
  // Obtenemos de una sola vez la evaluación global, las areas gerenciales y sus areas dependientes,
  // las evaluaciones de usuarios relacionadas a la actual evaluacion global (sin responder)
  // los objetivos actuales (no procesados y en proceso) y la cant. de usuarios sin asistencia informada
  const [evaluation, areas, userEvaluations, goals, pendingAssistance] =
    await Promise.all([
      models.Evaluation.findById(evaluationId),
      models.Area.find()
        .populate([
          { path: 'bosses', select: 'fullname email' },
          { path: 'employees', select: 'fullname email' },
          {
            path: 'parentArea',
            populate: [{ path: 'bosses', select: 'fullname email' }],
          },
        ])
        .sort({ name: 'asc' })
        .lean(),
      models.UserEvaluation.find({
        evaluation: evaluationId,
      })
        .select('user done')
        .lean(),
      models.Goal.find({
        processed: false,
        state: 'wip',
      })
        .select('toUserId state toUsersIds')
        .lean(),
      models.User.find({
        'score.assistance': 0,
        active: true,
        isNotEvaluable: false,
      }).count(),
    ]);

  if (!evaluation) {
    return {
      message: 'Evaluation does not exist',
    };
  }

  // Funcion para verificar si un area tiene objetivos pendientes de dar devolucion
  // En el caso del super admin no se le pasa area, toma a los gerentes
  const evaluateGoalsPendingToGiveFeedback = (area = null) => {
    // Variable que contiene el valor que se va a retornar finalmente
    let hasPendings = false;

    // Funcion que verifica segun un grupo de usuarios si alguno tiene algun objetivo en curso
    const hasPendingsForRole = (users) => {
      users?.forEach((user) => {
        // Solo continuamos verificando si el valor a retornar sigue siendo falso
        if (!hasPendings) {
          hasPendings = goals.some(
            (goal) =>
              goal.toUserId?.toString() === user._id.toString() ||
              goal.toUsersIds
                ?.map((id) => id.toString())
                .includes(user._id.toString())
          );
        }
      });
    };

    // Variable donde se van a incluir los miembros del equipo a validar segun el caso
    let teamUsers = [];

    // Si hay area (cualquier caso menos para el super admin)
    if (area) {
      // se validan faltantes de un area cualquiera
      // se agrega a sus empleados
      teamUsers = area.employees;

      // Se le agregan los jefes de las areas dependientes y si son sin jefe, se le agregan los empleados de esas areas
      area.dependentAreas.forEach((dependentAreaId) => {
        const currentArea = areas.find(
          (mappedArea) =>
            mappedArea._id.toString() === dependentAreaId.toString()
        );
        if (currentArea.withoutBoss) {
          teamUsers = [...teamUsers, ...currentArea.employees];
        } else {
          teamUsers = [...teamUsers, ...currentArea.bosses];
        }
      });
    } else {
      // Si no hay area (es para el super admin)
      // Los usuarios a dar feedback son los gerentes
      //TODO Validar por los usuarios que se les haya creado por fuera de los team users
      //   =>>> TODOS LOS OBJETIVOS CREADOS POR ESTE SUPERADMIN
      areas?.forEach((area) => {
        if (area.management) {
          teamUsers = [...area.bosses];
        }
      });
    }

    hasPendingsForRole(teamUsers);

    return hasPendings;
  };

  // Funcion para evaluar si un area tiene evaluaciones pendientes de crear
  // No incluye validacion para el caso del super admin, es el creationEnabled de la evaluacion global
  const evaluateEvaluationsPendingToComplete = (area) => {
    // Variable que contiene el valor que se va a retornar finalmente

    // Si no hay evaluaciones creadas, directamente devolvemos true
    if (!userEvaluations.length) {
      return true;
    }

    // De las evaluaciones creadas filtramos las pendientes
    const pendingEvaluations = userEvaluations.filter(
      (evaluation) => evaluation.done === false
    );

    // Mapeamos para obtener solo los ids
    const bossesIds = area.bosses.map((boss) => boss._id.toString());
    const employeesIds = area.employees.map((employee) =>
      employee._id.toString()
    );

    // armamos el array de team users para la validacion final
    const teamUsersIds = [...bossesIds, ...employeesIds];

    // Validamos si dentro de las evaluaciones pendientes algun user coincide con un user de teamusers
    return pendingEvaluations.some((userEvaluation) =>
      teamUsersIds.includes(userEvaluation.user.toString())
    );
  };

  // Se construye el objeto con el resultado que se retorna
  const result = {
    hasAdminGoalsPendingToGiveFeedback: evaluateGoalsPendingToGiveFeedback(),
    hasEvaluationsPendingToCreate: evaluation.isCreationEnabled,
    hasPendingAssistance: pendingAssistance > 0,
    areas: areas.map((area) => {
      return {
        _id: area._id,
        name: area.name,
        usersInCharge: area.withoutBoss ? area.parentArea.bosses : area.bosses,
        hasGoalsPendingToGiveFeedback: evaluateGoalsPendingToGiveFeedback(area),
        withoutEmployees: area.withoutEmployees,
        hasEvaluationsPendingToCreate: area.withoutEmployees
          ? false
          : !area.evaluationCreated,
        hasEvaluationsPendingToDo: evaluateEvaluationsPendingToComplete(area),
      };
    }),
    isCloseActionEnabled: false,
  };

  // Funcion que recorre el resultado y evalua si está habilitada el cierre de la Eval. global
  const evaluateGlobalEvaluationClosingEnabled = () => {
    // Variable con el valor a retornar. Se toma como primer valor los pendientes del super admin
    let enabled =
      !result.hasAdminGoalsPendingToGiveFeedback &&
      !result.hasPendingAssistance;

    // Si el valor a retornar es verdadero seguimos recorriendo el objeto
    // Si en algun momento llega a ser falso, no nos interesa seguir evaluando
    if (enabled) {
      // Por cada area gerencial se evalúa si hay objetivos pendientes de dar feedback
      // En este punto no nos interesan las evaluaciones, ya que en todos los casos lo verificamos por area dependiente
      result.areas?.forEach((area) => {
        if (enabled) {
          enabled =
            !area.hasEvaluationsPendingToCreate &&
            !area.hasEvaluationsPendingToDo &&
            !area.hasGoalsPendingToGiveFeedback;
        }
      });
    }
    return enabled;
  };

  // Se pasa el valor de la función anterior como prop del objeto resultado
  result.isCloseActionEnabled = evaluateGlobalEvaluationClosingEnabled();

  return result;
};

module.exports.getRelatedEvaluations = async (evaluationId, userId) => {
  const [user, evaluation, relatedEvaluations, company] = await Promise.all([
    User.findById(userId).select('fullname'),
    Evaluation.findById(evaluationId),
    UserEvaluation.find({
      evaluation: evaluationId,
      'affectedUsers.user': userId,
    })
      .select('label user affectedUsers answers')
      .populate({ path: 'user', select: 'fullname role' })
      .lean(),
    Company.findOne({}),
  ]);

  const {
    competencesScore,
    competencesScoreDetail,
    relatedEvaluationsDetail,
    currentImpacts,
    comments,
    totalEvaluations,
    totalAnsweredEvaluations,
  } = calculate360(
    relatedEvaluations,
    userId,
    company.impacts,
    company.competences
  );

  return {
    evaluationId,
    evaluation,
    user: user.fullname,
    userId: user._id,
    competencesScore,
    competencesScoreDetail,
    comments,
    companyImpacts: Object.keys(company.impacts).map((impact) => ({
      [impact]: `${company.impacts[impact]}%`,
    })),
    currentImpacts: currentImpacts.map((currentImpact) => ({
      [currentImpact.evaluationType]: `${currentImpact.impact}%`,
    })),
    relatedEvaluationsDetail,
    totalEvaluations,
    totalAnsweredEvaluations,
  };
};

module.exports.getCurrentEvaluationsByUser = async (evaluationId, userId) => {
  const [user, currentEvaluations] = await Promise.all([
    User.findById(userId).select('fullname'),
    UserEvaluation.find({
      evaluation: evaluationId,
      user: userId,
    }).populate({ path: 'affectedUsers.user', select: 'fullname' }),
  ]);

  return { user, currentEvaluations };
};

module.exports.validateIfEvaluationExist = async (
  userId,
  evaluationId,
  evaluationType,
  affectedUserId
) => {
  // Primero busco todas las userEvaluation relacionadas al usuario
  const userEvaluations = await UserEvaluation.find({
    evaluation: evaluationId,
    user: userId,
  }).lean();

  if (userEvaluations.length === 0) return null;

  // Si el evaluationType es de cualquiera de estos 3 tipos: 'BOSS_UP', 'BOSS_DOWN' o 'BOSS_PAIR'
  if (bossEvaluationTypes.includes(evaluationType)) {
    // Es una evaluación entre jefes
    // Hay que ver si de los affectedUsers alguno es de cualquiera de los 3 tipos de arriba
    // Todos se incluyen en una misma evaluación
    return userEvaluations.find((userEval) =>
      userEval.affectedUsers.some((affUser) =>
        bossEvaluationTypes.includes(affUser.evaluationType)
      )
    );
  }

  // Si el evaluationType es 'BOSS_EMPLOYEE'
  if (evaluationType === 'BOSS_EMPLOYEE') {
    // Es una evaluación  de jefe a empleados
    // Hay que tener en cuenta el area ya que para un jefe se pueden crear multiples de estas userEvaluation
    const currentAffectedUser = await User.findById(affectedUserId).populate({
      path: 'area',
      select: 'name',
    });

    return userEvaluations.find(
      (userEval) =>
        userEval.areaName === currentAffectedUser.area?.name &&
        userEval.affectedUsers.some(
          (affUser) => affUser.evaluationType === evaluationType
        )
    );
  }

  // Sino, directamente buscamos en base al evaluationType
  // EMPLOYEE_PAIR o EMPLOYEE_BOSS
  return userEvaluations.find((userEval) =>
    userEval.affectedUsers.some(
      (affUser) => affUser.evaluationType === evaluationType
    )
  );
};

module.exports.addUserToEvaluation = async (
  currentUserEval,
  affectedUser,
  req,
  userId
) => {
  await UserEvaluation.find({ _id: currentUserEval._id })
    .cursor()
    .eachAsync(async (doc) => {
      const userExists = doc.affectedUsers.some(
        (aff) => aff.user.toString() === affectedUser.user.toString()
      );
      if (!userExists) {
        doc.affectedUsers.push(affectedUser);
        await sendNotification(req, userId, EVALUATION, ADD_USER_TO_EVALUATION);
      }
      doc.done = false;
      doc.reOpen = currentUserEval.done;
      await doc.save();
    });
};

module.exports.createEvaluation = async (
  affectedUser,
  evaluationId,
  req,
  userId,
  role
) => {
  // Validar el tipo de evaluacion que se quiere crear (jefe o empleado)
  // affectedUser es el usuario clickeado para agregarlo a las relaciones
  if (affectedUser.forRole === 'boss') {
    // Es para jefe ...
    // Validamos si ya fueron creadas las evaluaciones para jefes
    // ( hay que encontrar al menos una para jefes )
    const someBossEvaluation = await UserEvaluation.findOne({
      evaluation: evaluationId,
      label: 'Evaluación a Jefes',
    });

    if (someBossEvaluation) {
      // Si fueron creadas, a este user no se le creó, entonces hay que crearla
      const newBossEvaluation = new UserEvaluation({
        label: 'Evaluación a Jefes',
        evaluation: evaluationId,
        competences: someBossEvaluation.competences,
        affectedUsers: [affectedUser],
        user: userId,
        createUserId: req.user._id,
      });

      await newBossEvaluation.save();

      sendNotification(req, userId, EVALUATION, NEW_EVALUATION);
    }

    // Sino, no se crea, pero ya queda la relación para cuando se creen
  } else {
    // Es para empleado ...
    // Buscamos el area del affectedUser
    const currentArea = await Area.findById(affectedUser.userArea);

    // Validamos si ya fueron creadas las evaluaciones para empleados para esta area
    if (currentArea.evaluationCreated) {
      // ( hay que encontrar la autoevaluación de este affectedUser )
      const selfEmployeeEvaluation = await UserEvaluation.findOne({
        isSelfEvaluation: true,
        user: affectedUser.user,
      });

      // Tenemos que validar si el 'role' del usuario al que se le están agregando affectedUsers es 'boss' o 'employee'
      // Esto determina los valores de 'label', de 'isMultiple', de 'withBonusPoint' y de 'areaName'
      const label =
        role === 'boss' ? 'Evaluación a Empleados' : 'Evaluación a Pares';
      const isMultiple = role === 'boss';
      const withBonusPoint = role === 'boss';
      const areaName = role === 'boss' ? currentArea.name : '';

      // Creamos la evaluación
      const newEvaluation = new UserEvaluation({
        label,
        isSelfEvaluation: false,
        evaluation: evaluationId,
        competences: selfEmployeeEvaluation.competences,
        affectedUsers: [affectedUser],
        user: userId,
        withBonusPoint,
        areaName,
        isMultiple,
        createUserId: userId,
      });

      await newEvaluation.save();

      sendNotification(req, userId, EVALUATION, NEW_EVALUATION);
    }

    // Sino, no se crea, y ya queda la relación para cuando se creen
  }
};

module.exports.deleteEvaluations = async (evaluationIds) => {
  return await UserEvaluation.deleteMany({ _id: { $in: evaluationIds } });
};
