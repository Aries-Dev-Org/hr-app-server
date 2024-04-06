module.exports.getCompetenceComment = (
  compentence,
  points,
  gold,
  silver,
  bronze
) => {
  if (points >= gold.minPoints)
    return compentence.behaviourQuestionOptions[0].labelOthers;
  if (points >= silver.minPoints)
    return compentence.behaviourQuestionOptions[1].labelOthers;
  if (points >= bronze.minPoints)
    return compentence.behaviourQuestionOptions[2].labelOthers;
  return compentence.behaviourQuestionOptions[3].labelOthers;
};
