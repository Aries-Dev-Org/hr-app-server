const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.getCompetences = async () => {
  const { Competence } = getCurrentConnectionModels();

  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.createCompetence = async (data) => {
  const { Competence } = getCurrentConnectionModels();

  const newCompetence = new Competence(data);
  await newCompetence.save();
  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.updateCompetence = async (competenceId, data) => {
  const { Competence } = getCurrentConnectionModels();

  await Competence.updateOne({ _id: competenceId }, data);
  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.createCompetenceTemplate = async (req) => {
  const { CompetencesTemplate } = getCurrentConnectionModels();

  const createUserId = req.user._id;
  const newCompetenceTemplate = new CompetencesTemplate({
    ...req.body,
    createUserId,
  });
  await newCompetenceTemplate.save();
  return await CompetencesTemplate.find({}).populate('competences');
};
