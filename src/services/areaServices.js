const Area = require('../models/Area');
const User = require('../models/User');
const { unlinkUserFromAffectedUsers } = require('./userServices');

//Obtener todas las areas
module.exports.getAreas = async () => {
  const areas = await Area.find({ management: true })
    .select('name bosses dependentAreas')
    .populate({
      path: 'bosses',
      select: 'fullname email avatar entry roleLabel range',
    })
    .populate({
      path: 'dependentAreas',
      select: 'name bosses employees withoutBoss',
      populate: [
        {
          path: 'bosses',
          select: 'fullname email avatar entry roleLabel range',
        },
        {
          path: 'employees',
          select: 'fullname email avatar entry roleLabel',
        },
      ],
    });

  return areas;
};

//Obtener un area
module.exports.getAreaById = async (areaId) => {
  const area = await Area.findById(areaId)
    .select('name bosses employees parentArea dependentAreas')
    .populate({
      path: 'bosses',
      select: 'name lastname email avatar score fullname role roleLabel range',
    })
    .populate({
      path: 'employees',
      select:
        'name lastname email score surveysResponses avatar fullname role roleLabel',
    })
    .populate({
      path: 'parentArea',
      select: 'name bosses',
      populate: {
        path: 'bosses',
        select: 'name lastname avatar email role roleLabel range',
      },
    })
    .populate({
      path: 'dependentAreas',
      select: 'name bosses employees',
      populate: {
        path: 'bosses',
        select: 'name lastname avatar email role roleLabel range',
      },
    });

  return area;
};

//Obtener varias areas por id
module.exports.getAreasByIds = async (areasIds) => {
  const areas = await Area.find({ _id: { $in: areasIds } })
    .select('name bosses employees')
    .populate({
      path: 'bosses',
      select: 'name lastname email avatar score fullname role roleLabel range',
    })
    .populate({
      path: 'employees',
      select:
        'name lastname email score surveysResponses avatar fullname role roleLabel',
    });

  return areas;
};

//Obtener average de un area
module.exports.getAreaSurveyAverage = async (area) => {
  const surveysResponses = [];
  await area.employees.forEach((e) =>
    surveysResponses.push(...e.surveysResponses)
  );
  const totalSurvey = surveysResponses.reduce((a, c) => a + c, 0);
  const surveyAverage = totalSurvey / surveysResponses.length;
  return surveyAverage;
};

//Obtener average de un conjunto de areas
module.exports.getAreasSurveyAverage = async (areasIds) => {
  const surveysResponses = [];
  const areas = await Area.find({ _id: { $in: areasIds } })
    .select('name bosses employees')
    .populate({
      path: 'bosses',
      select: 'surveysResponses',
    })
    .populate({
      path: 'employees',
      select: 'surveysResponses',
    });

  await areas.forEach((area) => {
    area.employees?.forEach((e) =>
      surveysResponses.push(...e.surveysResponses)
    );
    area.bosses?.forEach((e) => surveysResponses.push(...e.surveysResponses));
  });

  const totalSurvey = surveysResponses.reduce((a, c) => a + c, 0);
  const surveyAverage = totalSurvey / surveysResponses.length;
  return surveyAverage;
};

module.exports.getAreaByIdAndRelatedUsers = async (areaId) => {
  const selectedArea = await Area.findById(areaId)
    .populate({
      path: 'bosses',
      select:
        'fullname avatar role roleLabel evaluationRelationships range area active',
    })
    .populate({
      path: 'employees',
      select:
        'fullname avatar role roleLabel evaluationRelationships area active',
    })
    .populate({
      path: 'parentArea',
      populate: [
        {
          path: 'bosses',
          select: 'fullname avatar role roleLabel range active',
          populate: { path: 'area', select: 'name' },
        },
        {
          path: 'employees',
          select: 'fullname avatar role roleLabel active',
          populate: { path: 'area', select: 'name' },
        },
      ],
    })
    .populate({
      path: 'dependentAreas',
      populate: [
        {
          path: 'bosses',
          select: 'role fullname avatar role roleLabel range active',
          populate: { path: 'area', select: 'name' },
        },
        {
          path: 'employees',
          select: 'fullname avatar role roleLabel active',
          populate: { path: 'area', select: 'name' },
        },
      ],
    });
  return { selectedArea };
};

//Filtrar areas
module.exports.getAreaByFilter = async (value) => {
  const area = await Area.find({
    $or: [{ name: { $regex: value, $options: 'i' } }],
  });

  return area;
};

//Crear un area
module.exports.createArea = async (req) => {
  const newArea = new Area({ ...req.body, createUserId: req.user._id });
  await newArea.save();

  if (newArea.parentArea) {
    await Area.findByIdAndUpdate(newArea.parentArea, {
      $addToSet: { dependentAreas: newArea._id },
    });
  }

  return await Area.find({})
    .populate({
      path: 'dependentAreas',
      select: 'name',
    })
    .populate({
      path: 'parentArea',
      select: 'name',
    });
};

//Editar un area
module.exports.updateArea = async (req) => {
  const areaDB = await Area.findById(req.body.id);

  const hasParentArea = areaDB.parentArea;
  const isDifferentParentArea =
    hasParentArea && areaDB.parentArea !== req.body.parentArea;

  if (req.body.parentArea) {
    // Preguntamos si tiene Parent area, porque en el caso de las gerencias, no manda este param
    if (isDifferentParentArea) {
      await removeAreaFromDependentAreas(areaDB.parentArea, areaDB._id);
      await addAreaAsDependent(req.body.parentArea, req.body.id);
    } else if (!hasParentArea) {
      await addAreaAsDependent(req.body.parentArea, req.body.id);
    }
  }

  const shouldUpdateUsers =
    areaDB.withoutBoss !== req.body.withoutBoss ||
    areaDB.withoutEmployees !== req.body.withoutEmployees ||
    isDifferentParentArea;

  if (shouldUpdateUsers) {
    const areaUsers = [...areaDB.bosses, ...areaDB.employees];
    for (const userId of areaUsers) {
      await unlinkUserFromAffectedUsers(userId);
      await resetUserEvaluationRelationships(userId);
    }
  }

  await Area.findByIdAndUpdate(req.body.id, req.body);

  return await Area.find({})
    .populate({
      path: 'dependentAreas',
      select: 'name bosses employees withoutBoss',
    })
    .populate({
      path: 'bosses',
      select: 'fullname email avatar entry roleLabel range active',
    })
    .populate({
      path: 'employees',
      select: 'fullname email avatar entry roleLabel active',
    })
    .populate({
      path: 'parentArea',
      select: 'name bosses',
    })
    .sort({ name: 1 });
};

//Eliminar un area
module.exports.deleteArea = async (req) => {
  const areaDB = await Area.findById(req.params.id);

  if (
    areaDB?.employees.length ||
    areaDB?.bosses.length ||
    areaDB?.dependentAreas.length
  ) {
    return null;
  }

  if (areaDB.parentArea) {
    await Area.findByIdAndUpdate(areaDB.parentArea, {
      $pull: { dependentAreas: areaDB._id },
    });
  }

  await Area.findByIdAndDelete(req.params.id);

  return await Area.find({})
    .populate({
      path: 'dependentAreas',
      select: 'name',
    })
    .populate({
      path: 'parentArea',
      select: 'name',
    });
};

const removeAreaFromDependentAreas = async (parentAreaId, areaId) => {
  await Area.findByIdAndUpdate(parentAreaId, {
    $pull: { dependentAreas: areaId },
  });
};

const addAreaAsDependent = async (parentAreaId, areaId) => {
  await Area.findByIdAndUpdate(parentAreaId, {
    $addToSet: { dependentAreas: areaId },
  });
};

const resetUserEvaluationRelationships = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    evaluationRelationships: { confirmed: false, affectedUsers: [] },
  });
};
