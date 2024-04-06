const chartsRoutes = require('express').Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const Area = require('../models/Area');

// Obtener los usuarios y evaluaciones previas para determinar la consulta
chartsRoutes.get('/', verifyToken, async (_, res) => {
  const users = await User.find({ active: true, isSuperAdmin: false }).select(
    '_id fullname'
  );
  const evaluations = await Evaluation.find({ done: true }).select('_id name');
  const areas = await Area.find({}).select('name');

  res.status(200).send({
    users,
    evaluations,
    areas,
  });
});

chartsRoutes.get('/:stats', verifyToken, async (req, res) => {
  const { stats } = req.params;

  // si lo que se quiere es buscar por los puntos de un usuario
  if (stats === 'user-points') {
    const data = [];
    const { ids, evaluation } = req.query;
    const usersIdsArray = ids.split(',');

    const usersData = await User.find({ _id: { $in: usersIdsArray } }).select(
      'previousScores fullname score'
    );

    usersData.forEach((userData) => {
      if (userData.score.evaluationId === evaluation) {
        data.push({
          competences: userData.score.competences,
          objetives: userData.score.objetives,
          assistance: userData.score.assistance,
          totalScore: userData.score.totalScore,
          fullname: userData.fullname,
        });
      } else {
        userData.previousScores.forEach((prevScore) => {
          if (prevScore.evaluationId === evaluation) {
            data.push({
              competences: prevScore.competences,
              objetives: prevScore.objetives,
              assistance: prevScore.assistance,
              totalScore: prevScore.totalScore,
              fullname: userData.fullname,
            });
          }
        });
      }
    });

    res.status(200).send({ data });
  }

  // si se quiere buscar por puntajes de un area entera
  if (stats === 'area-points') {
    const { ids, evaluation } = req.query;
    const areasIdsArray = ids.split(',');

    // se buscan todos los usuarios que esten en alguna de las areas que se solicitan
    const usersData = await User.find({ area: { $in: areasIdsArray } })
      .populate({ path: 'area', select: 'name' })
      .select('previousScores area score');

    let groupedByArea = [];

    // se recorren los usuarios y se va armando un array de areas con la suma de los resultados de sus integrantes
    usersData.forEach((userData) => {
      // si exite ya el objeto del area en el array gral
      const existAreaInData = groupedByArea.some(
        (value) => value.areaName === userData.area.name
      );

      // los resultados del usuario, de la evaluacion que se pide
      let relatedEvaluationScore;

      // Si es de la ultima evalulacion cerrada, va a estar en el score, sino en previousScores
      if (userData.score.evaluationId === evaluation) {
        relatedEvaluationScore = { ...userData.score };
      } else {
        relatedEvaluationScore = userData.previousScores.find(
          (prevScore) => prevScore.evaluationId === evaluation
        );
      }

      if (!existAreaInData) {
        // si no existe el area en el array, la genero y la agrego
        groupedByArea.push({
          areaName: userData.area.name,
          competences: relatedEvaluationScore.competences,
          objetives: relatedEvaluationScore.objetives,
          assistance: relatedEvaluationScore.assistance,
          totalScore: relatedEvaluationScore.totalScore,
          users: 1,
        });
      } else {
        // si existe, actualizo solo esa area, agregandole la data del usuario (van a sumarse los resultados, dsp al final se dividen por cantidad de users)
        groupedByArea = groupedByArea.map((group) => {
          if (group.areaName === userData.area.name) {
            return {
              ...group,
              competences:
                group.competences + relatedEvaluationScore.competences,
              objetives: group.objetives + relatedEvaluationScore.objetives,
              assistance: group.assistance + relatedEvaluationScore.assistance,
              totalScore: group.totalScore + relatedEvaluationScore.totalScore,
              users: group.users + 1,
            };
          }
          return group;
        });
      }
    });

    const data = groupedByArea.map((area) => ({
      areaName: area.areaName,
      competences: area.competences / area.users,
      objetives: area.objetives / area.users,
      assistance: area.assistance / area.users,
      totalScore: area.totalScore / area.users,
    }));

    res.status(200).send({ data });
  }

  // si se quiere comparar los puntajes en diferentes evaluaciones
  if (
    stats === 'assistance' ||
    stats === 'objetives' ||
    stats === 'competences'
  ) {
    const { ids, evaluations } = req.query;

    const evaluationsIdsArray = evaluations.split(',');
    const usersIdsArray = ids.split(',');

    const usersData = await User.find({ _id: { $in: usersIdsArray } }).select(
      'previousScores score fullname'
    );
    const evaluationsData = await Evaluation.find({
      _id: { $in: evaluationsIdsArray },
    })
      .select('name createdAt')
      .sort({ createdAt: 1 });

    const data = [];

    usersData.forEach((userData) => {
      const resultData = {};
      resultData.fullname = userData.fullname;
      resultData.evaluations = [];

      evaluationsData.forEach((evaluation) => {
        const existsEvaluationScore = userData.previousScores.find(
          (prevScore) =>
            prevScore.evaluationId.toString() === evaluation._id.toString()
        );

        if (existsEvaluationScore) {
          resultData.evaluations.push({
            name: evaluation.name,
            points: existsEvaluationScore[stats],
          });
        } else if (
          userData.score.evaluationId.toString() === evaluation._id.toString()
        ) {
          resultData.evaluations.push({
            name: evaluation.name,
            points: userData.score[stats],
          });
        } else {
          resultData.evaluations.push({
            name: evaluation.name,
            points: 0,
          });
        }
      });

      data.push(resultData);
    });

    res.status(200).send({ data });
  }
});

module.exports = chartsRoutes;
