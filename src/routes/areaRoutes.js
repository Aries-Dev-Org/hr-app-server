const areaRoutes = require('express').Router();
// const clearCache = require('../helpers/clearCache');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getAreaSurveyAverage,
  getAreaById,
  getAreaByFilter,
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  getAreaByIdAndRelatedUsers,
  getAreasByIds,
  getAreasSurveyAverage,
} = require('../services/areaServices');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const Area = require('../models/Area');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const {
  validateIfEvaluationExist,
  createEvaluation,
  addUserToEvaluation,
} = require('../services/evaluationServices');

const upload = multer();

// Obtener todas las areas
areaRoutes.get('/', async (_, res) => {
  const areas = await getAreas();
  res.status(200).send(areas);
});

//Obtener todas las areas de la empresa para dibujar el organigrama
// TODO CAMBIAR, AHORA SE ESTÁN USANDO LAS AREAS DE GRAL DATA
areaRoutes.get('/company-chart', async (_, res) => {
  const managements = await getAreas();
  res.status(200).send({ managements });
});

//Obtener un area por un filtro
areaRoutes.get('/search', verifyToken, async (req, res) => {
  const { value } = req.query;

  if (!value) return res.status(404).send({ message: '[value] es requerido' });

  const areasDb = await getAreaByFilter(value);
  res.status(200).send(areasDb);
});

// Obtener datos para relaciones de evaluaciones de un area
areaRoutes.get('/relationships/:id', async (req, res) => {
  const { selectedArea } = await getAreaByIdAndRelatedUsers(req.params.id);
  const evaluations = await Evaluation.find({});
  res.status(200).send({ selectedArea, evaluations });
});

// confirmar relaciones para un usuario
areaRoutes.put('/relationships/confirm', async (req, res) => {
  const { userId, affectedUsers, areaId } = req.body;

  // Buscamos los ids de los added users
  const addedUsersIds = affectedUsers
    .filter((affectedUser) => affectedUser.isAddedUser)
    .map((addedUser) => addedUser.user);

  // Mapeamos los added y nos agregamos a nosotros en sus affected.
  // Si ya estamos, actualizamos en base al valor que venga en selected
  await User.find({ _id: { $in: addedUsersIds } })
    .cursor()
    .eachAsync(async (doc) => {
      const currentAffectedUsers = doc.evaluationRelationships.affectedUsers;
      const affectedUser = affectedUsers.find(
        (aff) => aff.user.toString() === doc._id.toString()
      ); // mi usuario agregado

      // Si ya estmaos en sus affected users, Actualizo mi usuario dentro de sus affected, y nos ponemos el selected que yo le puse a él
      if (currentAffectedUsers.some((aff) => aff.user.toString() === userId)) {
        doc.evaluationRelationships.affectedUsers = currentAffectedUsers.map(
          (aff) => {
            return aff.user.toString() === userId
              ? { ...aff, selected: affectedUser.selected }
              : aff;
          }
        );
      } else {
        doc.evaluationRelationships.affectedUsers = [
          ...doc.evaluationRelationships.affectedUsers,
          { ...affectedUser, userArea: areaId, user: userId },
        ];
      }

      await doc.save();
    });

  await User.findByIdAndUpdate(userId, {
    evaluationRelationships: {
      confirmed: true,
      affectedUsers,
    },
  });

  const { selectedArea } = await getAreaByIdAndRelatedUsers(areaId);

  res.status(200).send({
    payload: { selectedArea },
    message: 'Datos confirmados correctamente.',
  });
});

// confirmar relaciones para un usuario post evaluación global creada
areaRoutes.put('/relationships/post-evaluation/confirm', async (req, res) => {
  const { userId, affectedUsers, areaId, evaluationId } = req.body;

  // Antes que nada ya se guarda la nueva relación
  const currentUser = await User.findByIdAndUpdate(userId, {
    evaluationRelationships: {
      confirmed: true,
      affectedUsers,
    },
  });

  // Después se recorren los affectedUsers para evaluar que hacer con las nuevas relaciones
  // (postEvaluation y selected) =>>> se podrîa filtrar primero y luego hacer el for
  for await (const affectedUser of affectedUsers) {
    if (affectedUser.postEvaluation && affectedUser.selected) {
      // Servicio que evalua si existe una evaluacion que:
      // sea para este usuario (userId)
      // pertenezca a la actual evaluacion global (evaluationId)
      // y sea del tipo de evaluacion que trae cada affectedUser (affectedUser.evaluationType)
      const currentUserEval = await validateIfEvaluationExist(
        userId,
        evaluationId,
        affectedUser.evaluationType,
        affectedUser.user
      );

      // Si existe la userEvaluation, se agrega el affectedUser (o no, si ya estaba agregado)
      if (currentUserEval) {
        await addUserToEvaluation(currentUserEval, affectedUser, req, userId);
      } else {
        await createEvaluation(
          affectedUser,
          evaluationId,
          req,
          userId,
          currentUser.role
        );
      }
    }
  }

  const { selectedArea } = await getAreaByIdAndRelatedUsers(areaId);

  res.status(200).send({
    payload: { selectedArea },
    message: 'Datos confirmados correctamente.',
  });
});

// Obtener empleados y jefes de un conjunto de areas y promedio de staisfaccion del conjunto
areaRoutes.get('/multiple', async (req, res) => {
  const { areasIds } = req.query;
  const areasIdsArray = areasIds.split(',');
  const areas = await getAreasByIds(areasIdsArray);
  const surveyAverage = await getAreasSurveyAverage(areasIdsArray);
  res.status(200).send({ areas, surveyAverage });
});

// Obtener Area por id y promedio de staisfaccion del area
areaRoutes.get('/:id', async (req, res) => {
  const area = await getAreaById(req.params.id);
  const surveyAverage = await getAreaSurveyAverage(area);
  res.status(200).send({ area, surveyAverage });
});

// Crear Area
areaRoutes.post('/', verifyToken, async (req, res) => {
  // clearCache('/api/area/company-chart');
  const areas = await createArea(req);
  res
    .status(201)
    .send({ payload: { areas }, message: 'Area creada correctamente' });
});

// Cargar Areas desde una planilla
areaRoutes.post(
  '/loadAreas',
  verifyToken,
  verifyAdmin,
  upload.single('file'),
  async (req, res) => {
    const { file } = req;
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const areas = [];
      const rows = await readXlsxFile(Buffer.from(file.buffer));

      for (let i = 1; i < rows.length; i++) {
        const area = {};
        area['name'] = rows[i][0];
        area['management'] = rows[i][1] === 'si' ? true : false;
        area['withoutBoss'] = rows[i][2] === 'si' ? true : false;
        area['hasOwnPonderations'] = rows[i][3] === 'si' ? true : false;
        if (area.hasOwnPonderations) {
          area['ponderations'] = {
            competences: rows[i][4],
            objetives: rows[i][5],
            assistance: rows[i][6],
          };
        }
        areas.push(area);
      }

      await Area.insertMany(areas);
      const areasDb = await Area.find({})
        .populate({
          path: 'dependentAreas',
          select: 'name',
        })
        .populate({
          path: 'parentArea',
          select: 'name',
        });

      res.status(201).send({
        payload: { areas: areasDb },
        message: 'Areas cargadas correctamente',
      });
    } else {
      res
        .status(404)
        .send({ payload: [], message: 'El archivo cargado no es correcto.' });
    }
  }
);

//Actualizar un area
areaRoutes.put('/', verifyToken, async (req, res) => {
  const areas = await updateArea(req);
  res
    .status(201)
    .send({ payload: { areas }, message: 'Area actualizada correctamente' });
});

//Elimina un area
areaRoutes.delete('/:id', verifyToken, async (req, res) => {
  const areas = await deleteArea(req);

  if (!areas) {
    return res.status(400).send({ message: 'El area no se puede eliminar' });
  }

  res
    .status(201)
    .send({ payload: { areas }, message: 'Area eliminada correctamente' });
});

module.exports = areaRoutes;
