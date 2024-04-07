/* eslint-disable prefer-template */
/* eslint-disable no-console */
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const clientOption = {
  socketTimeoutMS: 10000,
  //   keepAlive: true,
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  maxPoolSize: 10,
};

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(
    'Mongoose default connection disconnected through app termination'
  );
  process.exit(0);
});

const initTenantDbConnection = (DB_URL) => {
  try {
    const db = mongoose.createConnection(DB_URL, clientOption);

    db.on(
      'error',
      console.error.bind(
        console,
        'initTenantDbConnection MongoDB Connection Error: '
      )
    );
    db.once('open', () => {
      console.log(`- ${db.name} db connected.`);
    });

    // Schemas registration
    db.model('Area', require('../models/Area'));
    db.model('Benefit', require('../models/Benefit'));
    db.model('Category', require('../models/Category'));
    db.model('Channel', require('../models/Channel'));
    db.model('Company', require('../models/Company'));
    db.model('Competence', require('../models/Competence'));
    db.model('CompetencesTemplate', require('../models/CompetencesTemplate'));
    db.model('Config', require('../models/Config'));
    db.model('Congratulation', require('../models/Congratulation'));
    db.model('Demand', require('../models/Demand'));
    db.model('Evaluation', require('../models/Evaluation'));
    db.model('Goal', require('../models/Goal'));
    db.model('Notification', require('../models/Notification'));
    db.model('Novelty', require('../models/Novelty'));
    db.model('Post', require('../models/Post'));
    db.model('Recognition', require('../models/Recognition'));
    db.model('Reminder', require('../models/Reminder'));
    db.model('Search', require('../models/Search'));
    db.model('User', require('../models/User'));
    db.model('UserEvaluation', require('../models/UserEvaluation'));
    db.model('UserProfile', require('../models/UserProfile'));

    return db;
  } catch (error) {
    console.log('initTenantDbConnection error', error);
  }
};

module.exports = {
  initTenantDbConnection,
};
