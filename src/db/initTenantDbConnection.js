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
    db.model('Area', require('../schemas/Area'));
    db.model('Benefit', require('../schemas/Benefit'));
    db.model('Category', require('../schemas/Category'));
    db.model('Channel', require('../schemas/Channel'));
    db.model('Company', require('../schemas/Company'));
    db.model('Competence', require('../schemas/Competence'));
    db.model('CompetencesTemplate', require('../schemas/CompetencesTemplate'));
    db.model('Config', require('../schemas/Config'));
    db.model('Congratulation', require('../schemas/Congratulation'));
    db.model('Demand', require('../schemas/Demand'));
    db.model('Evaluation', require('../schemas/Evaluation'));
    db.model('Goal', require('../schemas/Goal'));
    db.model('Notification', require('../schemas/Notification'));
    db.model('Novelty', require('../schemas/Novelty'));
    db.model('Post', require('../schemas/Post'));
    db.model('Recognition', require('../schemas/Recognition'));
    db.model('Reminder', require('../schemas/Reminder'));
    db.model('Search', require('../schemas/Search'));
    db.model('User', require('../schemas/User'));
    db.model('UserEvaluation', require('../schemas/UserEvaluation'));
    db.model('UserProfile', require('../schemas/UserProfile'));

    return db;
  } catch (error) {
    console.log('initTenantDbConnection error', error);
  }
};

module.exports = {
  initTenantDbConnection,
};
