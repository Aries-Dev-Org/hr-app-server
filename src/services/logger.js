const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/errors.log',
      level: 'error',
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        format.align(),
        format.printf(
          (log) => `${[log.timestamp]} - ${log.level}: ${log.message}`
        )
      ),
    }),
  ],
});

module.exports = logger;
