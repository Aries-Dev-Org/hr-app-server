module.exports.mergeCompetencesScores = (userDB, newScores) => {
  const { competencesScores } = userDB.score;
  const newcompetencesScores = newScores.map((newScore) => {
    if (
      competencesScores.some(
        (score) => String(score.competenceId) === String(newScore.competenceId)
      )
    ) {
      const prevScore = competencesScores.find(
        (score) => String(score.competenceId) === String(newScore.competenceId)
      );
      prevScore.competencePoints += newScore.competencePoints;
      return prevScore;
    } else {
      return newScore;
    }
  });
  return newcompetencesScores;
};
