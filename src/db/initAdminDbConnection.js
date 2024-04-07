/* eslint-disable prefer-template */
/* eslint-disable no-console */
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const clientOption = {
  socketTimeoutMS: 10000,
  // keepAlive: true,
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
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

const initAdminDbConnection = (DB_URL) => {
  try {
    console.log('Connecting to admin db ...');
    const db = mongoose.createConnection(DB_URL, clientOption);

    db.on(
      'error',
      console.error.bind(
        console,
        'initAdminDbConnection MongoDB Connection Error>> : '
      )
    );
    db.once('open', () => {
      console.log(`- ${db.name} admin db connected.`);
    });

    // Schemas registration
    db.model('Tenant', require('../schemas/Tenant'));

    return db;
  } catch (error) {
    console.log('initAdminDbConnection error', error);
  }
};

module.exports = {
  initAdminDbConnection,
};
