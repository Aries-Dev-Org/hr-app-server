const { getBenefitsDataForReport } = require('../Repository/benefit');
const { getSearchesDataForReport } = require('../Repository/search');

module.exports.createBenefitsExcel = async (workbook) => {
  const benefits = await getBenefitsDataForReport();

  const worksheet = workbook.addWorksheet('Beneficios');

  worksheet.addRow([
    'Beneficio',
    'Descripción',
    'Categoría',
    'Solicitante',
    'Área',
  ]);

  benefits.forEach((benefit) => {
    benefit.applicants.forEach((user) => {
      worksheet.addRow([
        benefit.title,
        benefit.description,
        benefit.category?.name,
        user.fullname,
        user.area.name,
      ]);
    });
  });

  worksheet.columns.forEach((_, i) => {
    i === 1
      ? (worksheet.columns[i].width = 40)
      : (worksheet.columns[i].width = 30);
  });
};

module.exports.createSearchesExcel = async (workbook) => {
  const searches = await getSearchesDataForReport();

  const worksheet = workbook.addWorksheet('Búsquedas');

  worksheet.addRow([
    'Área de búsqueda',
    'Puesto',
    'Tareas',
    'Requerimientos',
    'Solicitante',
    'Área actual del usuario',
  ]);

  searches.forEach((search) => {
    search.postulatedUsers.forEach((user) => {
      worksheet.addRow([
        search.area.name,
        search.job,
        search.tasks,
        search.requirements,
        user.fullname,
        user.area.name,
      ]);
    });
  });

  worksheet.columns.forEach((_, i) => {
    worksheet.columns[i].width = 30;
  });
};
