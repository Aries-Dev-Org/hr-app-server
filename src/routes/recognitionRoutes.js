const recognitionRoutes = require('express').Router();
const {
  getRanking,
  getRecognitions,
  createRecognition,
  deleteRecognitions,
  updateRecognition,
} = require('../services/recognitionServices');

//Obtener todos los reconocimientos, Ranking...
recognitionRoutes.get('/', async (req, res) => {
  const recognitions = await getRecognitions();
  const ranking = await getRanking();
  res.status(200).send({ recognitions, ranking });
});

// Crear un reconocimiento
recognitionRoutes.post('/', async (req, res) => {
  const recognitions = await createRecognition(req, res);
  const ranking = await getRanking();

  res.status(201).send({
    payload: { recognitions, ranking },
    message: 'Reconocimiento creado correctamente',
  });
});

// Borrar la tabla reconocimientos y los de cada usuario
recognitionRoutes.delete('/', async (req, res) => {
  await deleteRecognitions();
  res.status(200).send({ message: 'Recognitions removed' });
});

//Obtener el ranking de Reconocimientos
recognitionRoutes.get('/ranking', async (req, res) => {
  const ranking = await getRanking();
  res.status(200).send(ranking);
});

// Actualiza las reacciones de un reconocimiento
recognitionRoutes.put('/:recognitionId', async (req, res) => {
  await updateRecognition(req, res);
  const recognitions = await getRecognitions();
  const ranking = await getRanking();
  res
    .status(200)
    .send({ payload: { recognitions, ranking }, message: 'Reacción enviada' });
});

module.exports = recognitionRoutes;
