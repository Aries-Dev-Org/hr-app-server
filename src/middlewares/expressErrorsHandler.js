/* eslint-disable no-console */
const logger = require('../services/logger');

const expressErrorsHandler = (err, req, res, next) => {
  logger.error(`[ '${req.originalUrl}' - ${req.method} ] - ${err.message}`);
  console.log(
    '>>>>>>>>>>>>>>>>>>>>-----------------------------<<<<<<<<<<<<<<<<<<'
  );
  console.log(
    '>>> --- ERROR ORIGIN     --- >>>: ',
    `[ ${req.originalUrl} - ${req.method} ]`
  );
  console.log('>>> --- ERROR MESSAGE    --- >>>: ', err.message);
  console.log('>>> --- ERROR STACK      --- >>>: ', err.stack);
  console.log(
    '>>>>>>>>>>>>>>>>>>>>-----------------------------<<<<<<<<<<<<<<<<<<'
  );

  if (err instanceof CustomError) {
    res.status(err.status).send({ message: err.message });
  } else {
    res.status(500).send({ message: 'Ha ocurrido un error en el servidor.' });
  }
};

module.exports.expressErrorsHandler = expressErrorsHandler;

class CustomError extends Error {
  constructor(message = 'Ha ocurrido un error en el servidor', status = 500) {
    super(message);
    this.message = message;
    this.status = status;
  }
}

module.exports.CustomError = CustomError;
