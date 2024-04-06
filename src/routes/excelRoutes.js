/* eslint-disable no-useless-concat */
const excelRoutes = require('express').Router();
const path = require('path');
const ExcelJS = require('exceljs');
const {
  createBenefitsExcel,
  createSearchesExcel,
} = require('../services/excelServices');

excelRoutes.get('/download/:type', async (req, res) => {
  const { type } = req.params;

  let fileName;

  switch (type) {
    case 'users':
      fileName = 'load-users-example.xlsx';
      break;
    case 'areas':
      fileName = 'load-areas-example.xlsx';
      break;
  }

  if (fileName) {
    const filePath = path.resolve('src/files', fileName);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.status(200).sendFile(filePath);
  }

  res.status(404).send({ message: 'Tipo de archivo inválido.' });
});

excelRoutes.get('/generate/:entity', async (req, res) => {
  const { entity } = req.params;

  const workbook = new ExcelJS.Workbook();

  if (entity === 'benefit') {
    await createBenefitsExcel(workbook);
  }
  if (entity === 'searches') {
    await createSearchesExcel(workbook);
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'report.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = excelRoutes;
