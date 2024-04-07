const Competence = require('../models/Competence');
const CompetencesTemplate = require('../models/CompetencesTemplate');

module.exports.getCompetences = async () => {
  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.createCompetence = async (data) => {
  const newCompetence = new Competence(data);
  await newCompetence.save();
  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.updateCompetence = async (competenceId, data) => {
  await Competence.updateOne({ _id: competenceId }, data);
  return await Competence.find({}).sort({ name: 'asc' });
};

module.exports.createCompetenceTemplate = async (req) => {
  const createUserId = req.user._id;
  const newCompetenceTemplate = new CompetencesTemplate({
    ...req.body,
    createUserId,
  });
  await newCompetenceTemplate.save();
  return await CompetencesTemplate.find({}).populate('competences');
};
