module.exports.validRoles = {
  values: ['employee', 'boss'],
  message: '{VALUE} no es un rol válido',
};

module.exports.validEvaluationTypes = {
  values: ['DOWN', 'UP', 'PAIR', 'SELF'],
  message: '{VALUE} no es un rol válido',
};

module.exports.questionValidTypes = {
  values: ['behaviour', 'score', 'bonus'],
  message: '{VALUE} no es un tipo válido',
};

module.exports.validCategories = {
  values: ['Gold', 'Silver', 'Bronze'],
  message: '{VALUE} no es una categoría válida',
};

module.exports.validDemandState = {
  values: ['pending', 'wip', 'blocked', 'done'],
  message: '{VALUE} no es un estado válido',
};

module.exports.validDemandPriorities = {
  values: [1, 2, 3],
  message: '{VALUE} no es un estado válido',
};

module.exports.validGoalState = {
  values: ['wip', 'done', 'failed'],
  message: '{VALUE} no es un estado válido',
};

module.exports.validRecognitionReactions = {
  values: ['like', 'love', 'clap', 'party'],
  message: '{VALUE} no es una reacción válido',
};
