/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

mongoose.connection.on('open', () => {
  console.log('connected to db');
});

mongoose.connection.on('error', () => {
  console.log('error in connection to db');
});

mongoose.connection.on('close', () => {
  console.log('db connection is closed');
});

const dbConnect = async () => {
  await mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const dbDisconnect = async () => {
  await mongoose.disconnect();
};

module.exports = { dbConnect, dbDisconnect };
