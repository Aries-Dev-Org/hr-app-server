require('express-async-errors');
require('./services/cron.js');
const express = require('express');
const path = require('path');

// Routes Imports
const areaRoutes = require('./routes/areaRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const companyRoutes = require('./routes/companyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const demandRoutes = require('./routes/demandRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const generalDataRoutes = require('./routes/generalDataRoutes');
const goalRoutes = require('./routes/goalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const noveltyRoutes = require('./routes/noveltyRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');
const searchRoutes = require('./routes/searchRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const userPublicRoutes = require('./routes/userPublicRoutes.js');
const userRoutes = require('./routes/userRoutes');
const chartsRoutes = require('./routes/chartsRoutes');

// Middlewares Imports
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');
const { verifyToken } = require('./middlewares/authMiddleware');
const { expressErrorsHandler } = require('./middlewares/expressErrorsHandler');
const competenceRoutes = require('./routes/competenceRoutes.js');
const userProfileRoutes = require('./routes/userProfileRoutes.js');
const queryRoutes = require('./routes/queryRoutes.js');
const reminderRoutes = require('./routes/reminderRoutes.js');
const congratulationRoutes = require('./routes/congratulationRoutes.js');
const postRoutes = require('./routes/postRoutes.js');
const excelRoutes = require('./routes/excelRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const { setAdminDb } = require('./middlewares/connectionResolver.js');

/* const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}); */

// App Building
const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

// Middlewares
app.use(helmet());
// app.use(limiter);
app.use(mongoSanitize());
app.use(express.json({ limit: '500mb' }));
app.use(morgan('combined'));

// Public routes
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/user-public', userPublicRoutes);

// Private routes
app.use('/api/admin', verifyToken, setAdminDb, adminRoutes);
app.use('/api/area', verifyToken, areaRoutes);
app.use('/api/benefit', verifyToken, benefitRoutes);
app.use('/api/company', verifyToken, companyRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/demand', verifyToken, demandRoutes);
app.use('/api/evaluation', verifyToken, evaluationRoutes);
app.use('/api/generalData', verifyToken, generalDataRoutes);
app.use('/api/goal', verifyToken, goalRoutes);
app.use('/api/notification', verifyToken, notificationRoutes);
app.use('/api/novelty', verifyToken, noveltyRoutes);
app.use('/api/reminder', verifyToken, reminderRoutes);
app.use('/api/congratulation', verifyToken, congratulationRoutes);
app.use('/api/post', verifyToken, postRoutes);
app.use('/api/recognition', verifyToken, recognitionRoutes);
app.use('/api/search', verifyToken, searchRoutes);
app.use('/api/survey', verifyToken, surveyRoutes);
app.use('/api/user', verifyToken, userRoutes);
app.use('/api/userProfile', verifyToken, userProfileRoutes);
app.use('/api/competence', verifyToken, competenceRoutes);
app.use('/api/charts', verifyToken, chartsRoutes);
app.use('/api/excel', /* verifyToken, */ excelRoutes);

// Development Query Routes
app.use('/api/query', verifyToken, queryRoutes);

// Errors Handler Middleware
app.use(expressErrorsHandler);

module.exports = app;
