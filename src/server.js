/* eslint-disable no-console */
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { dbConnect } = require('./services/dbManager');
const socketBuilder = require('socket.io');
// const processName = process.env.name || 'primary';

const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV;

const server = http.createServer(app);

const socket = socketBuilder(server, {
  cors: {
    origin: process.env.ORIGIN,
  },
});

socket.on('connection', (socket) => {
  console.log('client connected: ', socket.id);
  socket.on('disconnect', (reason) => {
    console.info('client disconnected: ', socket.id, { reason });
  });
});

app.set('socket', socket);

const startServer = async () => {
  try {
    await dbConnect();

    server.listen(PORT, () => {
      console.info(`Server running in ${ENV} mode on port: ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to establish connection to the database: ', {
      error,
    });
  }
};

startServer();
