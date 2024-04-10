/* eslint-disable no-unused-vars */
const {
  getDemandsQty,
  getCompletedDemandsQty,
} = require('../Repository/demands');
const {
  getCurrentGoalsWithFeedbacksQty,
  getCurrentGoalsQty,
  getCurrentGoalsWithTodosQty,
} = require('../Repository/goal');
const { getRecognitionsQty } = require('../Repository/recognition');
const {
  getSearchesQty,
  getSearchesPostulations,
} = require('../Repository/search');
const {
  getUsersQty,
  getActiveUsersQty,
  getCurrentActionPlansQty,
  getCurrentActionPlansSeenQty,
  getGoldCategoryUsersQty,
  getSilverCategoryUsersQty,
  getBronzeCategoryUsersQty,
  getWithoutCategoryUsersQty,
} = require('../Repository/user');
const { getCurrentConnectionModels } = require('../db/connectionManager');

module.exports.createCompany = async (data) => {
  const { Company } = getCurrentConnectionModels();

  const newCompany = new Company(data);
  const company = await newCompany.save();
  return company;
};

module.exports.updateCompany = async (data) => {
  const { Category, Company } = getCurrentConnectionModels();

  const { _id, categories } = data;

  for await (const [_, category] of categories.entries()) {
    if (category?._id) {
      await Category.findByIdAndUpdate(category._id, {
        minPoints: category.minPoints,
        maxPoints: category.maxPoints,
      });
    }
  }

  const company = await Company.findByIdAndUpdate(_id, data, {
    new: true,
  }).populate('categories');

  return company;
};

module.exports.getAllStatus = async () => {
  const [
    allUsers,
    activeUsers,
    goalsQty,
    goalsWithFeedbacksQty,
    goalsWithTodosQty,
    recognitionsQty,
    currentActionPlansCreatedQty,
    currentActionPlansSeenQty,
    goldCategoryUsers,
    silverCategoryUsers,
    bronzeCategoryUsers,
    withoutCategoryUsers,
    searches,
    searchesPostulationsQty,
    demandsQty,
    completedDemandsQty,
  ] = await Promise.all([
    getUsersQty(),
    getActiveUsersQty(),
    getCurrentGoalsQty(),
    getCurrentGoalsWithFeedbacksQty(),
    getCurrentGoalsWithTodosQty(),
    getRecognitionsQty(),
    getCurrentActionPlansQty(),
    getCurrentActionPlansSeenQty(),
    getGoldCategoryUsersQty(),
    getSilverCategoryUsersQty(),
    getBronzeCategoryUsersQty(),
    getWithoutCategoryUsersQty(),
    getSearchesQty(),
    getSearchesPostulations(),
    getDemandsQty(),
    getCompletedDemandsQty(),
  ]);

  const status = [
    {
      title: 'Usuarios Activos',
      data: `${activeUsers}/${allUsers}`,
      percentage: Number(`${(activeUsers / allUsers) * 100}`).toFixed(2),
    },
    {
      title: 'Objetivos actuales',
      data: goalsQty,
      searchIcon: true,
    },
    {
      title: 'Objetivos actuales con feedbacks',
      data: `${goalsWithFeedbacksQty}/${goalsQty}`,
      percentage: Number(
        `${((goalsWithFeedbacksQty / goalsQty) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Objetivos actuales con tareas',
      data: `${goalsWithTodosQty}/${goalsQty}`,
      percentage: Number(
        `${((goalsWithTodosQty / goalsQty) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Reconocimientos realizados',
      data: `🎉${recognitionsQty}`,
      redirectUrl: '/reconocimientos',
    },
    {
      title: 'Planes de acción generados',
      data: `${currentActionPlansCreatedQty}/${activeUsers}`,
      percentage: Number(
        `${((currentActionPlansCreatedQty / activeUsers) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Planes de acción vistos',
      data: `${currentActionPlansSeenQty}/${currentActionPlansCreatedQty}`,
      percentage:
        Number(
          `${(
            (currentActionPlansSeenQty / currentActionPlansCreatedQty) *
            100
          ).toFixed(2)}`
        ) || 0,
    },
    {
      title: 'Usuarios activos con categoría Oro',
      data: `${goldCategoryUsers}/${activeUsers}`,
      percentage: Number(
        `${((goldCategoryUsers / activeUsers) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Usuarios activos con categoría Plata',
      data: `${silverCategoryUsers}/${activeUsers}`,
      percentage: Number(
        `${((silverCategoryUsers / activeUsers) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Usuarios activos con categoría Bronce',
      data: `${bronzeCategoryUsers}/${activeUsers}`,
      percentage: Number(
        `${((bronzeCategoryUsers / activeUsers) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Usuarios activos sin categoría',
      data: `${withoutCategoryUsers}/${activeUsers}`,
      percentage: Number(
        `${((withoutCategoryUsers / activeUsers) * 100).toFixed(2)}`
      ),
    },
    {
      title: 'Búsquedas internas activas',
      data: searches,
    },
    {
      title: 'Postulaciones para búsquedas',
      data: `${searchesPostulationsQty} para ${searches}`,
      redirectUrl: '/empresa/busquedas',
    },
    {
      title: 'Solicitudes completadas',
      data: `${completedDemandsQty}/${demandsQty}`,
      percentage: Number(
        `${((completedDemandsQty / demandsQty) * 100).toFixed(2)}`
      ),
    },
  ];

  return status;
};
