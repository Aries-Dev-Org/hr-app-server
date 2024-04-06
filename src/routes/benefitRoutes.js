const benefitRoutes = require('express').Router();
const { verifyAdmin } = require('../middlewares/authMiddleware');
const {
  getBenefits,
  createBenefit,
  updateBenefit,
  updateBenefitApplicants,
} = require('../services/banefitServices');
// const clearCache = require('../helpers/clearCache');
const uploadToSpaces = require('../middlewares/multerv2');
const Benefit = require('../models/Benefit');

//Obtener todos los beneficios
benefitRoutes.get('/', async (_, res) => {
  const benefits = await getBenefits();
  res.status(200).send({ benefits });
});

//Crear un beneficio
benefitRoutes.post('/', verifyAdmin, async (req, res) => {
  // clearCache('/api/benefit');
  const benefits = await createBenefit(req.body);
  res.status(201).send({
    payload: { benefits },
    message: 'Beneficio creado correctamente',
  });
});

//Actualizar un beneficio
benefitRoutes.put('/', verifyAdmin, async (req, res) => {
  const benefits = await updateBenefit(req.body);
  res.status(201).send({
    payload: { benefits },
    message: 'Beneficio actualizado correctamente',
  });
});

//Actualizar un beneficio
benefitRoutes.put('/apply', async (req, res) => {
  const benefits = await updateBenefitApplicants(req.body);
  res.status(201).send({
    payload: { benefits },
    message: 'Beneficio solicitado correctamente',
  });
});

benefitRoutes.put(
  '/updateImage/:id',
  verifyAdmin,
  uploadToSpaces(`${process.env.NODE_ENV}/${process.env.APPLICATION}/benefits`),
  async (req, res) => {
    const { Location } = req.file;
    const { id } = req.params;

    await Benefit.findByIdAndUpdate(id, {
      image: Location,
    });

    const benefits = await getBenefits();

    res.status(201).send({
      payload: { benefits },
      message: 'Imágen actualizada correctamente',
    });
  }
);

module.exports = benefitRoutes;
