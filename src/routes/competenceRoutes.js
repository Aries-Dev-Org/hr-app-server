const competenceRoutes = require('express').Router();
const {
  getCompetences,
  createCompetence,
  createCompetenceTemplate,
  updateCompetence,
} = require('../services/competenceServices');

// Obtener todas las competencias
competenceRoutes.get('/', async (_, res) => {
  const competences = await getCompetences();
  res.status(200).send({ competences });
});

// Crear competencia
competenceRoutes.post('/', async (req, res) => {
  const competences = await createCompetence(req.body);
  res.status(201).send({
    payload: { competences },
    message: 'Competencia creada correctamente',
  });
});

// Editar competencia
competenceRoutes.put('/:competenceId', async (req, res) => {
  const { competenceId } = req.params;
  const competences = await updateCompetence(competenceId, req.body);
  res.status(201).send({
    payload: { competences },
    message: 'Competencia editada correctamente',
  });
});

// Crear template de competencias
competenceRoutes.post('/template', async (req, res) => {
  const competencesTemplates = await createCompetenceTemplate(req);
  res.status(201).send({
    payload: { competencesTemplates },
    message: 'Template generado correctamente',
  });
});

module.exports = competenceRoutes;
