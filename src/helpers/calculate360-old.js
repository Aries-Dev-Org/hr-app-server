const calculate360 = (answers) => {
  const userPoints = [];
  const bonusCoins = 10;
  let newComment = null;

  Object.keys(answers).forEach((competenceId, i) => {
    const competence = answers[competenceId];
    Object.keys(competence).forEach((userId) => {
      // Si la key no es de bonusPoint
      if (userId !== 'bonusPointValue') {
        const user = competence[userId];
        const competencePoints = user.behaviour.points + user.score.points;
        const addedUser = userPoints.find((user) => user.userId === userId);
        // Si ya esta agregado el user al array
        if (addedUser) {
          if (i === Object.keys(answers).length - 1) {
            newComment = user.comments.length > 1 ? user.comments : null;
          }
          addedUser.points += competencePoints;
          addedUser.competencesScores.push({
            competenceId,
            competencePoints,
          });
          addedUser.newComment = newComment;
        } else {
          // Sino lo agregamos
          userPoints.push({
            userId,
            points: competencePoints,
            competencesScores: [
              {
                competenceId,
                competencePoints,
              },
            ],
            newComment: null,
            coins: 0,
          });
        }
      } else {
        // Si la key es de bonusPoint
        if (competence[userId]) {
          const addedUser = userPoints.find(
            (user) => user.userId === competence[userId]
          );
          if (addedUser) {
            addedUser.coins += bonusCoins;
          } else {
            userPoints.push({
              userId: competence[userId],
              points: 0,
              coins: bonusCoins,
            });
          }
        }
      }
    });
  });
  return userPoints;
};

module.exports = calculate360;
