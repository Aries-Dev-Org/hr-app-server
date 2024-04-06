const evaluationTypes = {
  BOSS_UP: 'BOSS_UP',
  BOSS_PAIR: 'BOSS_PAIR',
  BOSS_DOWN: 'BOSS_DOWN',
  BOSS_EMPLOYEE: 'BOSS_EMPLOYEE',
  EMPLOYEE_BOSS: 'EMPLOYEE_BOSS',
  EMPLOYEE_PAIR: 'EMPLOYEE_PAIR',
  BOSS_SELF: 'BOSS_SELF',
  EMPLOYEE_SELF: 'EMPLOYEE_SELF',
  SELF: 'SELF',
};

const finalEvaluationTypes = [
  {
    key: 'DOWN',
    relatedTo: [evaluationTypes.BOSS_DOWN, evaluationTypes.BOSS_EMPLOYEE],
    label: 'Desde arriba',
  },
  {
    key: 'PAIR',
    relatedTo: [evaluationTypes.BOSS_PAIR, evaluationTypes.EMPLOYEE_PAIR],
    label: 'Pares',
  },
  {
    key: 'UP',
    relatedTo: [evaluationTypes.BOSS_UP, evaluationTypes.EMPLOYEE_BOSS],
    label: 'Desde abajo',
  },
  {
    key: 'SELF',
    relatedTo: [
      evaluationTypes.BOSS_SELF,
      evaluationTypes.EMPLOYEE_SELF,
      evaluationTypes.SELF,
    ],
    label: 'Autoevaluación',
  },
];

const getFinalEvaluationTypes = (relatedEvaluations) => {
  return relatedEvaluations.map((data) => {
    const finalType = finalEvaluationTypes.find((type) =>
      type.relatedTo.includes(data.evaluationType)
    );
    return { ...data, evaluationType: finalType.key };
  });
};

const getCurrentTypes = (relatedEvaluations, impacts) => {
  const missingTypes = [];
  const existingTypes = [];
  Object.keys(impacts).forEach((type) => {
    if (
      !relatedEvaluations.find((related) => related.evaluationType === type)
    ) {
      missingTypes.push(type);
    } else {
      existingTypes.push(type);
    }
  });
  return { missingTypes, existingTypes };
};

const getRelatedEvaluationsDetail = (relatedEvaluations, userId) => {
  let comments = '';
  const allComments = [];
  const relatedEvaluationsDetail = relatedEvaluations.map((evaluation) => {
    comments = '';
    const dataToSHow = {};
    dataToSHow._id = evaluation._id;
    dataToSHow.label = evaluation.label;
    const currentAffectdUser = evaluation.affectedUsers.find(
      (affectedUser) => String(affectedUser.user) === String(userId)
    );
    dataToSHow.evaluationType = currentAffectdUser.evaluationType;
    dataToSHow.user = evaluation.user.fullname;
    let answers = null;
    let totalEvaluationPoints = 0;

    answers = {};
    Object.keys(evaluation.answers).forEach((competence) => {
      const behaviourPoints =
        evaluation.answers[competence][userId].behaviour.points * 12.5;
      const scorePoints =
        evaluation.answers[competence][userId].score.points * 12.5;
      const totalCompetencePoints = (behaviourPoints + scorePoints) / 2;
      comments = evaluation.answers[competence][userId].comments;
      answers[competence] = {
        behaviourPoints,
        scorePoints,
        totalCompetencePoints,
        bonusPoint:
          String(evaluation.answers[competence].bonusPointValue) ===
          String(userId),
      };

      totalEvaluationPoints += totalCompetencePoints;
    });

    dataToSHow.answers = answers;
    dataToSHow.totalEvaluationPoints = totalEvaluationPoints / 5;
    if (comments?.length) {
      allComments.push(comments);
    }
    return dataToSHow;
  });

  return { relatedEvaluationsDetail, comments: allComments };
};

const getCurrentImpact = (
  type,
  typeQty,
  missingTypes,
  existingTypes,
  companyImpacts
) => {
  const originalPonderation = Number(companyImpacts[type]);
  let ponderationAdded = 0;
  let totalExistingPonderations = 0;

  existingTypes.forEach((existingType) => {
    totalExistingPonderations += Number(companyImpacts[existingType]);
  });

  missingTypes.forEach((missingType) => {
    const missingPonderation = Number(companyImpacts[missingType]);
    const rate = (originalPonderation * 1) / totalExistingPonderations;
    ponderationAdded += missingPonderation * rate;
  });

  const finalType = finalEvaluationTypes.find((evType) => evType.key === type);

  return {
    evaluationType: type,
    impact: originalPonderation + ponderationAdded,
    qty: typeQty,
    label: finalType.label,
  };
};

const calculateImpacts = (relatedEvaluations, companyImpacts) => {
  const evaluationTypes = getFinalEvaluationTypes(relatedEvaluations);
  const { missingTypes, existingTypes } = getCurrentTypes(
    evaluationTypes,
    companyImpacts
  );
  const impacts = existingTypes.map((type) => {
    const typeQty = evaluationTypes.filter(
      (evaluation) => evaluation.evaluationType === type
    ).length;
    return getCurrentImpact(
      type,
      typeQty,
      missingTypes,
      existingTypes,
      companyImpacts
    );
  });

  return { evaluationTypes, currentImpacts: impacts };
};

const getCompetencesScoreDetail = (currentImpacts, evaluationTypes) => {
  const competencesScoreDetail = [];
  let competencesScore = 0;

  evaluationTypes.forEach((evaluation) => {
    const currenImpact = currentImpacts.find(
      (currentImpact) =>
        currentImpact.evaluationType === evaluation.evaluationType
    );
    if (evaluation.answers) {
      Object.keys(evaluation.answers).forEach((competenceId) => {
        const currentPoints =
          (evaluation.answers[competenceId].totalCompetencePoints *
            currenImpact.impact) /
          currenImpact.qty /
          100;

        const currentCompetence = competencesScoreDetail.find(
          (score) => score.competenceId === competenceId
        );
        if (currentCompetence) {
          currentCompetence.points += currentPoints;
        } else {
          competencesScoreDetail.push({
            competenceId,
            points: currentPoints,
          });
        }
        competencesScore += currentPoints;
      });
    }
  });

  return { competencesScoreDetail, competencesScore: competencesScore / 5 };
};

const calculate360 = (
  relatedEvaluations,
  userId,
  companyImpacts,
  competencesPonderation
) => {
  const answeredEvaluations = relatedEvaluations.filter((e) => e.answers);
  const totalEvaluations = relatedEvaluations.length;
  const totalAnsweredEvaluations = answeredEvaluations.length;

  const { relatedEvaluationsDetail, comments } = getRelatedEvaluationsDetail(
    answeredEvaluations,
    userId
  );

  const { evaluationTypes, currentImpacts } = calculateImpacts(
    relatedEvaluationsDetail,
    companyImpacts
  );

  const { competencesScoreDetail, competencesScore } =
    getCompetencesScoreDetail(
      currentImpacts,
      evaluationTypes,
      competencesPonderation
    );

  return {
    competencesScore,
    competencesScoreDetail,
    comments,
    currentImpacts,
    relatedEvaluationsDetail,
    totalEvaluations,
    totalAnsweredEvaluations,
  };
};

module.exports = calculate360;
